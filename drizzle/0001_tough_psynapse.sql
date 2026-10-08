CREATE TABLE `daily_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameKey` varchar(64) NOT NULL,
	`gameName` varchar(120) NOT NULL,
	`postDate` varchar(10) NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text NOT NULL,
	`visibility` enum('free','vip') NOT NULL DEFAULT 'free',
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_posts_id` PRIMARY KEY(`id`)
);
