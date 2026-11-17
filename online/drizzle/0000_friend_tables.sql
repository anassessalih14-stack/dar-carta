CREATE TABLE `friend_tables_state` (
  `id` integer PRIMARY KEY NOT NULL,
  `version` integer NOT NULL DEFAULT 0,
  `payload` text NOT NULL
);
