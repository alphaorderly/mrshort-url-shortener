import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 예전 버전(synchronize: true)이 만들던 스키마와 완전히 같다.
 * 이미 테이블이 있는 기존 DB 에서는 아무 일도 하지 않고, 새 DB 에서는 처음부터 만든다.
 */
export class BaselineSchema1730246400000 implements MigrationInterface {
  name = 'BaselineSchema1730246400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL NOT NULL,
        "username" character varying(100) NOT NULL,
        "password" character varying NOT NULL,
        CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"),
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shorten" (
        "id" SERIAL NOT NULL,
        "deleted" boolean NOT NULL DEFAULT false,
        "originalURL" character varying NOT NULL,
        "shortenedURL" character varying NOT NULL,
        "expiredAt" TIMESTAMP,
        "password" character varying,
        "userIDId" integer,
        CONSTRAINT "UQ_44873a4a861c07e77c338bf18e2" UNIQUE ("shortenedURL"),
        CONSTRAINT "PK_f43226bede2b1ff5f2e2a45d0ec" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "click" (
        "id" SERIAL NOT NULL,
        "clickDate" TIMESTAMP NOT NULL,
        "shortenId" integer,
        CONSTRAINT "PK_4c018a5603e0d5e63fe022b0d97" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_2548725edaca8b179b09f3beaea') THEN
          ALTER TABLE "shorten" ADD CONSTRAINT "FK_2548725edaca8b179b09f3beaea"
            FOREIGN KEY ("userIDId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_3d8e44b9d8267136ec80b8cd4a8') THEN
          ALTER TABLE "click" ADD CONSTRAINT "FK_3d8e44b9d8267136ec80b8cd4a8"
            FOREIGN KEY ("shortenId") REFERENCES "shorten"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "click"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shorten"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
