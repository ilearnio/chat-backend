import { customAlphabet } from 'nanoid/async';

const nanoid = customAlphabet('1234567890abcdef', 10);

export const randomId = async (size = 16) => {
  return nanoid(size);
}
