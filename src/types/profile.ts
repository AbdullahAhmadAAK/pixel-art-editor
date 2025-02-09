interface MongoID {
  $oid: string;
}

interface MongoDate {
  $date: string;
}

interface MongoLong {
  $numberLong: string;
}

interface LinkedAccountBase {
  id: string;
  firstVerifiedAt: MongoDate;
  latestVerifiedAt: MongoDate;
  type: string;
}

interface WalletAccount extends LinkedAccountBase {
  type: "wallet";
  address: string;
  normalizedAddress: string;
  chainId: string;
  walletClientType: string;
  walletType: string | null;
  connectorType: string;
  hdWalletIndex: number | null;
  imported: boolean | null;
}

interface TelegramAccount extends LinkedAccountBase {
  type: "telegram";
  telegramUserId: string;
  username: string;
  firstName: string;
  lastName: string | null;
  photoUrl: string;
}

interface DiscordAccount extends LinkedAccountBase {
  type: "discord_oauth";
  username: string;
  email: string;
}

interface TwitterAccount extends LinkedAccountBase {
  type: "twitter_oauth";
  username: string;
  name: string;
  profilePictureUrl: string;
}

interface GoogleAccount extends LinkedAccountBase {
  type: "google_oauth";
  email: string;
  subject: string;
}

interface EmailAccount extends LinkedAccountBase {
  type: "email";
  address: string;
  normalizedAddress: string;
}

interface PhoneAccount extends LinkedAccountBase {
  type: "phone";
  number: string;
}

export type LinkedAccount =
  | WalletAccount
  | TelegramAccount
  | DiscordAccount
  | TwitterAccount
  | GoogleAccount
  | EmailAccount
  | PhoneAccount;

interface AssociatedAccount {
  _id: MongoID;
  walletAddress: string;
  accountIdentifier: string;
  username: string | null;
  linkedMethod: string;
  appName: string;
}

interface Preferences {
  hideIsDeveloper: boolean;
}

export interface Profile {
  _id: MongoID;
  address: string;
  normalizedAddress: string;
  registeredAt: MongoLong;
  updatedAt: number;
  username: string;
  avatar: string;
  funded: MongoLong;
  bot: boolean;
  userGroups: number;
  tracking: Record<string, unknown>;
  privyId: string;
  referredBy: string | null;
  readyPlayerMeAccId: string;
  avatarID: string;
  isOnline: boolean;
  lastLogin: number;
  lastOnline: number;
  linkedAccounts: LinkedAccount[];
  preferences: Preferences;
  associatedAccounts: AssociatedAccount[];
  eligible?: boolean;
}
