import { Repository } from "typeorm";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { PostgreDataSource } from "../../database/data-source";
import { Thread } from "../../database/entities/Thread";
import { User } from "../../database/entities/User";
import { Upload } from "../../database/entities/Upload";
import handleError from "../utils/exception/handleError";
import BadRequestError from "../utils/exception/custom/BadRequestError";
import NotFoundError from "../utils/exception/custom/NotFoundError";

export default new (class ThreadServices {
  private readonly ThreadRepository: Repository<Thread> =
    PostgreDataSource.getRepository(Thread);
  private readonly UserRepository: Repository<User> =
    PostgreDataSource.getRepository(User);
  private readonly UploadRepository: Repository<Upload> =
    PostgreDataSource.getRepository(Upload);

  async add(req: Request, res: Response): Promise<Response> {
    try {
      const userSelected: User | null = await this.UserRepository.findOne({
        where: {
          id: res.locals.auth.id,
        },
      });

      if (!userSelected) {
        throw new NotFoundError(
          `User with ID ${res.locals.auth.id} not found`,
          "User Not Found"
        );
      }

      const { content, image, uploadId } = req.body;

      const thread: Thread = new Thread();
      thread.id = uuidv4();
      thread.content = content;
      if (image) thread.image = image;
      thread.user = userSelected;
      await this.ThreadRepository.save(thread);
      if (uploadId) await this.UploadRepository.delete(uploadId);

      return res.status(201).json({
        code: 201,
        status: "success",
        message: "Add Thread Success",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async findAll(req: Request, res: Response): Promise<Response> {
    try {
      let page =
        typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
      page = page > 1 ? page : 1;

      const threads: Thread[] = await this.ThreadRepository.find({
        relations: ["user", "likes.user", "replies"],
        select: {
          user: {
            id: true,
            username: true,
            fullname: true,
            profile_picture: true,
          },
          likes: {
            id: true,
            created_at: true,
            updated_at: true,
            user: {
              id: true,
              username: true,
              fullname: true,
              profile_picture: true,
            },
          },
        },
        take: 10,
        skip: page * 10 - 10,
        order: {
          created_at: "DESC",
        },
      });

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Find All Thread Success",
        data: threads.map((thread) => {
          return {
            ...thread,
            replies: thread.replies.length,
          };
        }),
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async findOne(req: Request, res: Response): Promise<Response> {
    try {
      const { threadId } = req.params;

      if (
        !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89aAbB][a-f\d]{3}-[a-f\d]{12}$/.test(
          threadId
        )
      ) {
        throw new BadRequestError(
          "The sent ID is not a valid UUID format",
          "UUID Error"
        );
      }

      const thread: Thread | null = await this.ThreadRepository.findOne({
        where: {
          id: threadId,
        },
        relations: ["user", "likes.user", "replies.user"],
        select: {
          user: {
            id: true,
            username: true,
            fullname: true,
            profile_picture: true,
          },
          likes: {
            id: true,
            created_at: true,
            updated_at: true,
            user: {
              id: true,
              username: true,
              fullname: true,
              profile_picture: true,
            },
          },
          replies: {
            id: true,
            content: true,
            image: true,
            created_at: true,
            updated_at: true,
            user: {
              id: true,
              username: true,
              fullname: true,
              profile_picture: true,
            },
          },
        },
        // order: {
        //   replies: {
        //     created_at: "DESC",
        //   },
        // },
      });

      if (!thread) {
        throw new NotFoundError(
          `Thread with ID ${threadId} not found`,
          "Thread Not Found"
        );
      }

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Find One Thread Success",
        data: thread,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async updateOne(req: Request, res: Response): Promise<Response> {
    try {
      const { threadId } = req.params;

      if (
        !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89aAbB][a-f\d]{3}-[a-f\d]{12}$/.test(
          threadId
        )
      ) {
        throw new BadRequestError(
          "The sent ID is not a valid UUID format",
          "UUID Error"
        );
      }

      const thread: Thread | null = await this.ThreadRepository.findOne({
        where: {
          id: threadId,
        },
      });

      if (!thread) {
        throw new NotFoundError(
          `Thread with ID ${threadId} not found`,
          "Thread Not Found"
        );
      }

      const { content } = req.body;

      thread.content = content;
      await this.ThreadRepository.save(thread);

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Update One Thread Success",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async deleteOne(req: Request, res: Response): Promise<Response> {
    try {
      const { threadId } = req.params;

      if (
        !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89aAbB][a-f\d]{3}-[a-f\d]{12}$/.test(
          threadId
        )
      ) {
        throw new BadRequestError(
          "The sent ID is not a valid UUID format",
          "UUID Error"
        );
      }

      const thread: Thread | null = await this.ThreadRepository.findOne({
        where: {
          id: threadId,
        },
      });

      if (!thread) {
        throw new NotFoundError(
          `Thread with ID ${threadId} not found`,
          "Thread Not Found"
        );
      }

      await this.ThreadRepository.delete(threadId);

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Delete One Thread Success",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
})();
