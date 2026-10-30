import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinkMetadata1730246400001 implements MigrationInterface {
  name = 'AddLinkMetadata1730246400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 기존 링크는 생성 시각을 알 수 없으므로 NULL 로 두고, 새 링크부터 기본값을 채운다.
    await queryRunner.query(
      `ALTER TABLE "shorten" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "shorten" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shorten_user" ON "shorten" ("userIDId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_click_shorten_date" ON "click" ("shortenId", "clickDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_click_shorten_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shorten_user"`);
    await queryRunner.query(
      `ALTER TABLE "shorten" DROP COLUMN IF EXISTS "createdAt"`,
    );
  }
}
