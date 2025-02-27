/**
 * Represents metadata for a Liveblocks user.
 * This data comes from `user.info` in Liveblocks.
 */
export type LiveblocksUserMeta = {
  /** Unique identifier for the user */
  id: string;
  /** Custom user info set when authenticating with a secret key */
  info: {
    /** User's display name */
    name: string;
    /** URL of the user's profile picture. At the moment, this links to a randomly-selected avatar from a selection of avatars. */
    picture: string;
  };
};
