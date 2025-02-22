export type LiveblocksUserMeta = {
  id: string;
  // Custom user info set when authenticating with a secret key
  info: {
    name: string;
    picture: string;
  };
};