CREATE TYPE "public"."academic_identity_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."institution_membership_status" AS ENUM('ACTIVE', 'SUSPENDED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."institution_role" AS ENUM('ADMIN', 'TEACHER', 'STUDENT');--> statement-breakpoint
CREATE TABLE "academic_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"institutional_identifier" text NOT NULL,
	"status" "academic_identity_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"role" "institution_role" NOT NULL,
	"status" "institution_membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_identities" ADD CONSTRAINT "academic_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identities" ADD CONSTRAINT "academic_identities_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_identities_user_institution_unique" ON "academic_identities" USING btree ("user_id","institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_identities_identifier_unique" ON "academic_identities" USING btree ("institution_id","institutional_identifier");--> statement-breakpoint
CREATE INDEX "academic_identities_institution_idx" ON "academic_identities" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institution_memberships_user_institution_role_unique" ON "institution_memberships" USING btree ("user_id","institution_id","role");--> statement-breakpoint
CREATE INDEX "institution_memberships_institution_idx" ON "institution_memberships" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "institution_memberships_user_idx" ON "institution_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institutions_slug_unique" ON "institutions" USING btree ("slug");