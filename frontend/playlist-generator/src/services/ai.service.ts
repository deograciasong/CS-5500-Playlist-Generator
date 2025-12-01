import api from './api';

export interface AIGenerateOptions {
  length?: number;
  mood?: string;
}

export async function generateFromSpotify(length = 30, mood?: string) {
  try {
    const resp = await api.post('/ai/playlists/generate', { length, mood });
    return resp.data;
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'AI generation failed';
    throw new Error(message);
  }
}

export default { generateFromSpotify };
