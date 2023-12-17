import * as Sentry from '@sentry/react';
import mixpanel from 'mixpanel-browser';
import { ApiSchemas, ApiTypes } from 'quadratic-shared/typesAndSchemas';
import { v4 as uuid } from 'uuid';
import { downloadQuadraticFile } from '../helpers/downloadFileInBrowser';
import { generateKeyBetween } from '../utils/fractionalIndexing';
import { fetchFromApi } from './fetchFromApi';

const DEFAULT_FILE: any = {
  sheets: [
    {
      name: 'Sheet 1',
      id: { id: uuid() },
      order: generateKeyBetween(null, null),
      cells: [],
      code_cells: [],
      formats: [],
      columns: [],
      rows: [],
      offsets: [[], []],
      borders: {},
    },
  ],
  // TODO(ddimaria): make this dynamic
  version: '1.4',
};

export const apiClient = {
  teams: {
    async list() {
      return fetchFromApi(`/v0/teams`, { method: 'GET' }, ApiSchemas['/v0/teams.GET.response']);
    },
    async get(uuid: string) {
      return fetchFromApi(`/v0/teams/${uuid}`, { method: 'GET' }, ApiSchemas['/v0/teams/:uuid.GET.response']);
    },
    async update(uuid: string, body: ApiTypes['/v0/teams/:uuid.POST.request']) {
      return fetchFromApi(
        `/v0/teams/${uuid}`,
        { method: 'POST', body: JSON.stringify(body) },
        ApiSchemas['/v0/teams/:uuid.POST.response']
      );
    },
    async create(body: ApiTypes['/v0/teams.POST.request']) {
      return fetchFromApi(
        `/v0/teams`,
        { method: 'POST', body: JSON.stringify(body) },
        ApiSchemas['/v0/teams.POST.response']
      );
    },
    invites: {
      async create(teamUuid: string, body: ApiTypes['/v0/teams/:uuid/invites.POST.request']) {
        return fetchFromApi(
          `/v0/teams/${teamUuid}/invites`,
          {
            method: 'POST',
            body: JSON.stringify(body),
          },
          ApiSchemas['/v0/teams/:uuid/invites.POST.response']
        );
      },
      async delete(teamUuid: string, inviteId: string) {
        console.log(`DELETE to /v0/teams/${teamUuid}/invites/${inviteId}`);
        return fetchFromApi(
          `/v0/teams/${teamUuid}/invites/${inviteId}`,
          {
            method: 'DELETE',
          },
          ApiSchemas['/v0/teams/:uuid/invites/:inviteId.DELETE.response']
        );
      },
    },
    users: {
      async update(teamUuid: string, userId: string, body: ApiTypes['/v0/teams/:uuid/users/:userId.POST.request']) {
        return fetchFromApi(
          `/v0/teams/${teamUuid}/users/${userId}`,
          { method: 'POST', body: JSON.stringify(body) },
          ApiSchemas['/v0/teams/:uuid/users/:userId.POST.response']
        );
      },
      async delete(teamUuid: string, userId: string) {
        return fetchFromApi(
          `/v0/teams/${teamUuid}/users/${userId}`,
          { method: 'DELETE' },
          ApiSchemas['/v0/teams/:uuid/users/:userId.DELETE.response']
        );
      },
    },
  },

  async getFiles() {
    return fetchFromApi(`/v0/files`, { method: 'GET' }, ApiSchemas['/v0/files.GET.response']);
  },

  async getFile(uuid: string) {
    return fetchFromApi(`/v0/files/${uuid}`, { method: 'GET' }, ApiSchemas['/v0/files/:uuid.GET.response']);
  },

  async createFile(
    body: ApiTypes['/v0/files.POST.request'] = {
      name: 'Untitled',
      contents: JSON.stringify(DEFAULT_FILE),
      version: DEFAULT_FILE.version,
    }
  ) {
    return fetchFromApi(
      `/v0/files/`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/files.POST.response']
    );
  },

  async downloadFile(uuid: string) {
    mixpanel.track('[Files].downloadFile', { id: uuid });
    return this.getFile(uuid).then((json) => downloadQuadraticFile(json.file.name, json.file.contents));
  },

  async deleteFile(uuid: string) {
    mixpanel.track('[Files].deleteFile', { id: uuid });
    return fetchFromApi(`/v0/files/${uuid}`, { method: 'DELETE' }, ApiSchemas['/v0/files/:uuid.DELETE.response']);
  },

  async updateFile(uuid: string, body: ApiTypes['/v0/files/:uuid.POST.request']) {
    return fetchFromApi(
      `/v0/files/${uuid}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      ApiSchemas['/v0/files/:uuid.POST.response']
    );
  },

  async updateFileThumbnail(uuid: string, thumbnail: Blob) {
    const formData = new FormData();
    formData.append('thumbnail', thumbnail, 'thumbnail.png');

    return fetchFromApi<ApiTypes['/v0/files/:uuid/thumbnail.POST.response']>(
      `/v0/files/${uuid}/thumbnail`,
      {
        method: 'POST',
        body: formData,
      },
      ApiSchemas['/v0/files/:uuid/thumbnail.POST.response']
    );
  },

  async getFileSharing(uuid: string) {
    return fetchFromApi(
      `/v0/files/${uuid}/sharing`,
      {
        method: 'GET',
      },
      ApiSchemas['/v0/files/:uuid/sharing.GET.response']
    );
  },
  async updateFileSharing(uuid: string, body: ApiTypes['/v0/files/:uuid/sharing.POST.request']) {
    return fetchFromApi(
      `/v0/files/${uuid}/sharing`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      ApiSchemas['/v0/files/:uuid/sharing.POST.response']
    );
  },

  async postFeedback(body: ApiTypes['/v0/feedback.POST.request']) {
    return fetchFromApi(
      `/v0/feedback`,
      { method: 'POST', body: JSON.stringify(body) },
      ApiSchemas['/v0/feedback.POST.response']
    );
  },

  getApiUrl() {
    const url = import.meta.env.VITE_QUADRATIC_API_URL;
    if (!url) {
      const message = 'VITE_QUADRATIC_API_URL env variable is not set.';
      Sentry.captureEvent({
        message,
        level: 'fatal',
      });
      throw new Error(message);
    }

    return url;
  },

  // Someday: figure out how to fit in the calls for the AI chat
};
