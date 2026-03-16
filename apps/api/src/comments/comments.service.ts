import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { TasksRepository } from '../tasks/tasks.repository';
import { UsersService } from '../users/users.service';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
    NOTIFICATION_STRATEGIES,
    NotificationPayload,
    NotificationStrategy,
} from './strategies/notification.strategy';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private tasksRepository: TasksRepository,
    private usersService: UsersService,
    private eventsGateway: EventsGateway,
    @Inject(NOTIFICATION_STRATEGIES)
    private notificationStrategies: NotificationStrategy[],
  ) {}

  /**
   * Create a new comment and notify mentioned users
   *
   * Strategy pattern in action: iterates through all registered notification
   * strategies to send notifications. Adding a new channel (email, push) only
   * requires implementing NotificationStrategy and registering it.
   */
  async create(dto: CreateCommentDto, authorId: string): Promise<Comment> {
    // Get task to find boardId
    const task = await this.tasksRepository.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Get author info for notification
    const author = await this.usersService.findById(authorId);

    // Create the comment
    const comment = await this.commentsRepository.create({
      content: dto.content,
      taskId: dto.taskId,
      boardId: task.boardId,
      authorId,
    });

    // Broadcast comment creation via WebSocket
    this.eventsGateway.broadcastCommentCreated(task.boardId, comment);

    // Extract @mentions and notify users using Strategy pattern
    const mentionedNames = this.extractMentions(dto.content);
    if (mentionedNames.length > 0) {
      const mentionedUsers = await this.usersService.findByNames(mentionedNames);

      // Notify each mentioned user through all strategies
      for (const user of mentionedUsers) {
        // Don't notify the author if they mentioned themselves
        if (user.id === authorId) continue;

        const payload: NotificationPayload = {
          type: 'mention',
          title: 'You were mentioned in a comment',
          body: `${author?.name || 'Someone'} mentioned you: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          taskId: dto.taskId,
          boardId: task.boardId,
          commentId: comment.id,
          senderId: authorId,
          senderName: author?.name || undefined,
        };

        // Strategy pattern: iterate through all notification strategies
        for (const strategy of this.notificationStrategies) {
          await strategy.send(user.id, payload);
        }
      }
    }

    return comment;
  }

  /**
   * Extract @mentions from comment content
   * Matches @username patterns where username can contain letters, numbers, dots, and underscores
   */
  extractMentions(content: string): string[] {
    const mentionRegex = /@([\w.]+)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }

    // Remove duplicates
    return [...new Set(matches)];
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    return this.commentsRepository.findByTaskId(taskId);
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, userId: string): Promise<Comment> {
    const comment = await this.findOne(id);

    // Only the author can update their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.commentsRepository.update(id, dto);

    // Broadcast update via WebSocket
    this.eventsGateway.broadcastCommentUpdated(comment.boardId, updatedComment);

    return updatedComment;
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    // Only the author can delete their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.delete(id);

    // Broadcast deletion via WebSocket
    this.eventsGateway.broadcastCommentDeleted(comment.boardId, id, comment.taskId);
  }
}
