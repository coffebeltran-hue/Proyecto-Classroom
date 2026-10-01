CREATE TYPE "public"."institution_access_request_status" AS ENUM('PENDING', 'APPROVED', 'DENIED');--> statement-breakpoint
CREATE TYPE "public"."institution_access_role" AS ENUM('TEACHER', 'STUDENT');--> statement-breakpoint
CREATE TABLE "institution_access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"status" "institution_access_request_status" DEFAULT 'PENDING' NOT NULL,
	"assigned_role" "institution_access_role",
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institution_access_requests_decision_shape_check" CHECK (
        (
          (
            "institution_access_requests"."status" = 'PENDING'
            AND "institution_access_requests"."assigned_role" IS NULL
            AND "institution_access_requests"."decided_by_user_id" IS NULL
            AND "institution_access_requests"."decided_at" IS NULL
          )
          OR
          (
            "institution_access_requests"."status" = 'APPROVED'
            AND "institution_access_requests"."assigned_role" IS NOT NULL
            AND "institution_access_requests"."decided_by_user_id" IS NOT NULL
            AND "institution_access_requests"."decided_at" IS NOT NULL
          )
          OR
          (
            "institution_access_requests"."status" = 'DENIED'
            AND "institution_access_requests"."assigned_role" IS NULL
            AND "institution_access_requests"."decided_by_user_id" IS NOT NULL
            AND "institution_access_requests"."decided_at" IS NOT NULL
          )
        )
      )
);
--> statement-breakpoint
ALTER TABLE "institution_access_requests" ADD CONSTRAINT "institution_access_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_access_requests" ADD CONSTRAINT "institution_access_requests_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_access_requests" ADD CONSTRAINT "institution_access_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "institution_access_requests_user_institution_unique" ON "institution_access_requests" USING btree ("user_id","institution_id");--> statement-breakpoint
CREATE INDEX "institution_access_requests_institution_status_idx" ON "institution_access_requests" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "institution_access_requests_user_idx" ON "institution_access_requests" USING btree ("user_id");