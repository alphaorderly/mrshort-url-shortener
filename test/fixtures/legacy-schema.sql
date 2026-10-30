
CREATE TABLE public.click (
    id integer NOT NULL,
    "clickDate" timestamp without time zone NOT NULL,
    "shortenId" integer
);

CREATE SEQUENCE public.click_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.click_id_seq OWNED BY public.click.id;

CREATE TABLE public.shorten (
    id integer NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    "originalURL" character varying NOT NULL,
    "shortenedURL" character varying NOT NULL,
    "expiredAt" timestamp without time zone,
    password character varying,
    "userIDId" integer
);

CREATE SEQUENCE public.shorten_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.shorten_id_seq OWNED BY public.shorten.id;

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying NOT NULL
);

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;

ALTER TABLE ONLY public.click ALTER COLUMN id SET DEFAULT nextval('public.click_id_seq'::regclass);

ALTER TABLE ONLY public.shorten ALTER COLUMN id SET DEFAULT nextval('public.shorten_id_seq'::regclass);

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);

ALTER TABLE ONLY public.click
    ADD CONSTRAINT "PK_4c018a5603e0d5e63fe022b0d97" PRIMARY KEY (id);

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);

ALTER TABLE ONLY public.shorten
    ADD CONSTRAINT "PK_f43226bede2b1ff5f2e2a45d0ec" PRIMARY KEY (id);

ALTER TABLE ONLY public.shorten
    ADD CONSTRAINT "UQ_44873a4a861c07e77c338bf18e2" UNIQUE ("shortenedURL");

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username);

ALTER TABLE ONLY public.shorten
    ADD CONSTRAINT "FK_2548725edaca8b179b09f3beaea" FOREIGN KEY ("userIDId") REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.click
    ADD CONSTRAINT "FK_3d8e44b9d8267136ec80b8cd4a8" FOREIGN KEY ("shortenId") REFERENCES public.shorten(id) ON DELETE CASCADE;

