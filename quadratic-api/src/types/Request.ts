import { File, Team, User } from '@prisma/client';
import { Request as JWTRequest } from 'express-jwt';
import { Access, UserRoleTeam } from 'quadratic-shared/typesAndSchemas';

export interface UploadFile extends Express.Multer.File {
  key: string; // Available using `S3`.
}

// API Request that extends the express-jwt Request type
// middleware is used to these fields
// auth is added by validateAccessToken
// user is added by userMiddleware
// document is added by fileMiddleware
// file is added by the multer middleware
export interface Request extends JWTRequest {
  auth?: {
    sub: string;
  };
  user?: User;
  quadraticFile?: File;
  file?: UploadFile;
}

export type RequestWithAuth = Request & {
  auth: { sub: string };
};

export type RequestWithUser = RequestWithAuth & {
  user: User;
};

export type RequestWithTeam = RequestWithUser & {
  team: {
    data: Team;
    user: {
      role: UserRoleTeam;
      access: Access[];
    };
  };
};
