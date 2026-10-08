CREATE TABLE `owner_bindings` (
	`id` int NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`ownerEmail` varchar(320) NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'google',
	`lockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_bindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_bindings_ownerOpenId_unique` UNIQUE(`ownerOpenId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isOwner` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','disabled','removed') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `sessionVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `mfaSecret` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `mfaVerifiedAt` timestamp;