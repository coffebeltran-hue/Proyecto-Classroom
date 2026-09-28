CREATE SCHEMA "rr03_proof";
--> statement-breakpoint
CREATE TABLE "rr03_proof"."installation" (
	"app_id" bigint NOT NULL,
	"installation_id" bigint NOT NULL,
	"account_id" bigint NOT NULL,
	"capability" text NOT NULL,
	CONSTRAINT "installation_app_id_installation_id_pk" PRIMARY KEY("app_id","installation_id")
);
--> statement-breakpoint
CREATE TABLE "rr03_proof"."receipt" (
	"app_id" bigint NOT NULL,
	"delivery_id" text NOT NULL,
	"installation_id" bigint,
	"event" text NOT NULL,
	"digest" text NOT NULL,
	"status" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_app_id_delivery_id_pk" PRIMARY KEY("app_id","delivery_id")
);
