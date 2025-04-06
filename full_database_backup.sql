--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.warehouses DROP CONSTRAINT warehouses_supplier_id_fkey;
ALTER TABLE ONLY public.user_order_access DROP CONSTRAINT user_order_access_user_id_fkey;
ALTER TABLE ONLY public.user_order_access DROP CONSTRAINT user_order_access_order_id_fkey;
ALTER TABLE ONLY public.user_customer_access DROP CONSTRAINT user_customer_access_user_id_fkey;
ALTER TABLE ONLY public.user_customer_access DROP CONSTRAINT user_customer_access_customer_id_fkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_rental_id_fkey;
ALTER TABLE ONLY public.rentals DROP CONSTRAINT rentals_order_id_fkey;
ALTER TABLE ONLY public.rentals DROP CONSTRAINT rentals_equipment_id_fkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_customer_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_order_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_customer_id_fkey;
ALTER TABLE ONLY public.invoice_items DROP CONSTRAINT invoice_items_rental_id_fkey;
ALTER TABLE ONLY public.invoice_items DROP CONSTRAINT invoice_items_invoice_id_fkey;
ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_warehouse_id_fkey;
ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_supplier_id_fkey;
ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_category_id_fkey;
ALTER TABLE ONLY public.delivery_notes DROP CONSTRAINT delivery_notes_order_id_fkey;
ALTER TABLE ONLY public.billing_items DROP CONSTRAINT billing_items_rental_id_fkey;
ALTER TABLE ONLY public.billing_items DROP CONSTRAINT billing_items_equipment_id_fkey;
ALTER TABLE ONLY public.billing_items DROP CONSTRAINT billing_items_billing_data_id_fkey;
ALTER TABLE ONLY public.billing_data DROP CONSTRAINT billing_data_order_id_fkey;
DROP TRIGGER update_user_order_access_modtime ON public.user_order_access;
DROP TRIGGER update_user_customer_access_modtime ON public.user_customer_access;
DROP TRIGGER update_delivery_notes_modified ON public.delivery_notes;
DROP TRIGGER update_billing_items_modified ON public.billing_items;
DROP TRIGGER update_billing_data_modified ON public.billing_data;
DROP INDEX public.idx_user_order_access_user_id;
DROP INDEX public.idx_user_order_access_order_id;
DROP INDEX public.idx_user_customer_access_user_id;
DROP INDEX public.idx_user_customer_access_customer_id;
DROP INDEX public.idx_returns_batch_id;
DROP INDEX public.idx_rentals_order_id;
DROP INDEX public.idx_rentals_equipment_id;
DROP INDEX public.idx_rentals_batch_id;
DROP INDEX public.idx_equipment_warehouse_id;
DROP INDEX public.idx_equipment_supplier_id;
DROP INDEX public.idx_equipment_is_external;
DROP INDEX public.idx_delivery_notes_order_id;
DROP INDEX public.idx_billing_items_rental_id;
DROP INDEX public.idx_billing_items_billing_data_id;
DROP INDEX public.idx_billing_data_order_id;
ALTER TABLE ONLY public.warehouses DROP CONSTRAINT warehouses_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.user_order_access DROP CONSTRAINT user_order_access_user_id_order_id_key;
ALTER TABLE ONLY public.user_order_access DROP CONSTRAINT user_order_access_pkey;
ALTER TABLE ONLY public.user_customer_access DROP CONSTRAINT user_customer_access_user_id_customer_id_key;
ALTER TABLE ONLY public.user_customer_access DROP CONSTRAINT user_customer_access_pkey;
ALTER TABLE ONLY public.suppliers DROP CONSTRAINT suppliers_pkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_pkey;
ALTER TABLE ONLY public.rentals DROP CONSTRAINT rentals_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_order_number_key;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_pkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_invoice_number_key;
ALTER TABLE ONLY public.invoice_items DROP CONSTRAINT invoice_items_pkey;
ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_pkey;
ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_inventory_number_key;
ALTER TABLE ONLY public.equipment_categories DROP CONSTRAINT equipment_categories_pkey;
ALTER TABLE ONLY public.delivery_notes DROP CONSTRAINT delivery_notes_pkey;
ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
ALTER TABLE ONLY public.billing_items DROP CONSTRAINT billing_items_pkey;
ALTER TABLE ONLY public.billing_data DROP CONSTRAINT billing_data_pkey;
ALTER TABLE public.warehouses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_order_access ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_customer_access ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.suppliers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.returns ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.rentals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.equipment_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.equipment ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.delivery_notes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.billing_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.billing_data ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.warehouses_id_seq;
DROP TABLE public.warehouses;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.user_order_access_id_seq;
DROP TABLE public.user_order_access;
DROP SEQUENCE public.user_customer_access_id_seq;
DROP TABLE public.user_customer_access;
DROP SEQUENCE public.suppliers_id_seq;
DROP TABLE public.suppliers;
DROP SEQUENCE public.returns_id_seq;
DROP TABLE public.returns;
DROP SEQUENCE public.rentals_id_seq;
DROP TABLE public.rentals;
DROP SEQUENCE public.orders_id_seq;
DROP TABLE public.orders;
DROP SEQUENCE public.invoices_id_seq;
DROP TABLE public.invoices;
DROP SEQUENCE public.invoice_items_id_seq;
DROP TABLE public.invoice_items;
DROP SEQUENCE public.equipment_id_seq;
DROP SEQUENCE public.equipment_categories_id_seq;
DROP TABLE public.equipment_categories;
DROP TABLE public.equipment;
DROP SEQUENCE public.delivery_notes_id_seq;
DROP TABLE public.delivery_notes;
DROP SEQUENCE public.customers_id_seq;
DROP TABLE public.customers;
DROP SEQUENCE public.billing_items_id_seq;
DROP TABLE public.billing_items;
DROP SEQUENCE public.billing_data_id_seq;
DROP TABLE public.billing_data;
DROP FUNCTION public.update_modified_column();
--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: billing_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_data (
    id integer NOT NULL,
    order_id integer,
    invoice_number character varying(50) NOT NULL,
    billing_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(10,2) NOT NULL,
    is_final_billing boolean DEFAULT false,
    status character varying(20) DEFAULT 'created'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    billing_period_from date,
    billing_period_to date
);


--
-- Name: billing_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_data_id_seq OWNED BY public.billing_data.id;


--
-- Name: billing_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_items (
    id integer NOT NULL,
    billing_data_id integer,
    rental_id integer,
    equipment_id integer,
    description character varying(200) NOT NULL,
    days integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price_per_day numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: billing_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_items_id_seq OWNED BY public.billing_items.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    type character varying(20) DEFAULT 'individual'::character varying NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(100),
    phone character varying(20),
    address text,
    ico character varying(20),
    dic character varying(20),
    customer_category character varying(20) DEFAULT 'regular'::character varying,
    credit numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_notes (
    id integer NOT NULL,
    order_id integer,
    delivery_note_number character varying(50) NOT NULL,
    issue_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: delivery_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delivery_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delivery_notes_id_seq OWNED BY public.delivery_notes.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category_id integer,
    inventory_number character varying(50) NOT NULL,
    purchase_price numeric(10,2),
    daily_rate numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    location character varying(100),
    description text,
    photo_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    article_number character varying(50),
    product_designation character varying(200),
    material_value numeric(10,2),
    monthly_rate numeric(10,2),
    weight_per_piece numeric(10,2),
    square_meters_per_piece numeric(10,2),
    total_stock integer,
    total_square_meters numeric(10,2),
    is_external boolean DEFAULT false,
    supplier_id integer,
    external_rental_cost numeric(10,2),
    rental_start_date date,
    rental_end_date date,
    external_reference character varying(100),
    return_date date,
    rental_status character varying(20) DEFAULT 'active'::character varying,
    warehouse_id integer NOT NULL
);


--
-- Name: equipment_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: equipment_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_categories_id_seq OWNED BY public.equipment_categories.id;


--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer,
    rental_id integer,
    description character varying(200) NOT NULL,
    days integer,
    price_per_day numeric(10,2),
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    customer_id integer,
    order_id integer,
    invoice_number character varying(50) NOT NULL,
    issue_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    due_date timestamp with time zone,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'created'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_id integer,
    order_number character varying(50) NOT NULL,
    creation_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'created'::character varying,
    estimated_end_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(200)
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: rentals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rentals (
    id integer NOT NULL,
    order_id integer,
    equipment_id integer,
    issue_date timestamp with time zone,
    planned_return_date timestamp with time zone,
    actual_return_date timestamp with time zone,
    daily_rate numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'created'::character varying,
    issue_condition text,
    issue_photo_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    quantity integer DEFAULT 1,
    note text,
    is_billed boolean DEFAULT false,
    batch_id character varying(100)
);


--
-- Name: rentals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rentals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rentals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rentals_id_seq OWNED BY public.rentals.id;


--
-- Name: returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    rental_id integer,
    return_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    condition character varying(20) DEFAULT 'ok'::character varying,
    damage_description text,
    damage_photo_url character varying(255),
    additional_charges numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    quantity integer DEFAULT 1,
    batch_id character varying(100)
);


--
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact_person character varying(100),
    email character varying(100),
    phone character varying(20),
    address text,
    ico character varying(20),
    dic character varying(20),
    bank_account character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: user_customer_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_customer_access (
    id integer NOT NULL,
    user_id integer,
    customer_id integer,
    access_type character varying(20) DEFAULT 'read'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_customer_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_customer_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_customer_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_customer_access_id_seq OWNED BY public.user_customer_access.id;


--
-- Name: user_order_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_order_access (
    id integer NOT NULL,
    user_id integer,
    order_id integer,
    access_type character varying(20) DEFAULT 'read'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_order_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_order_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_order_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_order_access_id_seq OWNED BY public.user_order_access.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    is_external boolean DEFAULT false,
    supplier_id integer,
    location character varying(200),
    contact_person character varying(100),
    phone character varying(20),
    email character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: billing_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_data ALTER COLUMN id SET DEFAULT nextval('public.billing_data_id_seq'::regclass);


--
-- Name: billing_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items ALTER COLUMN id SET DEFAULT nextval('public.billing_items_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_notes ALTER COLUMN id SET DEFAULT nextval('public.delivery_notes_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: equipment_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_categories ALTER COLUMN id SET DEFAULT nextval('public.equipment_categories_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: rentals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals ALTER COLUMN id SET DEFAULT nextval('public.rentals_id_seq'::regclass);


--
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: user_customer_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_customer_access ALTER COLUMN id SET DEFAULT nextval('public.user_customer_access_id_seq'::regclass);


--
-- Name: user_order_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_order_access ALTER COLUMN id SET DEFAULT nextval('public.user_order_access_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: billing_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_data (id, order_id, invoice_number, billing_date, total_amount, is_final_billing, status, notes, created_at, updated_at, billing_period_from, billing_period_to) FROM stdin;
1	2	INV-ZAK-250323-143-20250323	2025-03-23 00:00:00+01	948.09	f	created	Fakturační podklad vygenerován 2025-03-23	2025-03-23 21:40:34.870168+01	2025-03-27 21:07:59.179493+01	2025-03-23	2025-03-23
2	2	INV-ZAK-250323-143-20250320	2025-03-20 00:00:00+01	2844.27	f	created	Fakturační podklad vygenerován 2025-03-23	2025-03-23 21:40:45.144615+01	2025-03-27 21:07:59.179493+01	2025-03-20	2025-03-20
3	2	INV-ZAK-250323-143-20250323	2025-03-23 00:00:00+01	1057.33	f	created	Fakturační podklad vygenerován 2025-03-23	2025-03-23 21:43:32.260311+01	2025-03-27 21:07:59.179493+01	2025-03-23	2025-03-23
4	2	INV-ZAK-250323-143-20250323	2025-03-23 00:00:00+01	1057.33	f	created	Fakturační podklad vygenerován 2025-03-24	2025-03-24 16:10:02.14721+01	2025-03-27 21:07:59.179493+01	2025-03-23	2025-03-23
5	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	8246.31	f	created	Fakturační podklad vygenerován 2025-03-24	2025-03-24 16:10:08.960674+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
6	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	8652.31	f	created	Fakturační podklad vygenerován 2025-03-24	2025-03-24 16:57:05.745613+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
7	2	INV-ZAK-250323-143-20250324	2025-03-24 00:00:00+01	2520.66	f	created	Fakturační podklad vygenerován 2025-03-24	2025-03-24 17:03:43.380812+01	2025-03-27 21:07:59.179493+01	2025-03-24	2025-03-24
8	2	INV-ZAK-250323-143-20250324	2025-03-24 00:00:00+01	2608.86	f	created	Fakturační podklad vygenerován 2025-03-24	2025-03-24 17:08:41.170855+01	2025-03-27 21:07:59.179493+01	2025-03-24	2025-03-24
9	2	INV-ZAK-250323-143-20250325	2025-03-25 00:00:00+01	1868.55	f	created	Fakturační podklad vygenerován 2025-03-25	2025-03-25 15:23:54.549109+01	2025-03-27 21:07:59.179493+01	2025-03-25	2025-03-25
10	2	INV-ZAK-250323-143-20250325	2025-03-25 00:00:00+01	1868.55	f	created	Fakturační podklad vygenerován 2025-03-25	2025-03-25 15:24:19.440979+01	2025-03-27 21:07:59.179493+01	2025-03-25	2025-03-25
11	2	INV-ZAK-250323-143-20250325	2025-03-25 00:00:00+01	1393.02	f	created	Fakturační podklad vygenerován 2025-03-25	2025-03-25 15:24:42.48344+01	2025-03-27 21:07:59.179493+01	2025-03-25	2025-03-25
12	2	INV-ZAK-250323-143-20250325	2025-03-25 00:00:00+01	1868.55	f	created	Fakturační podklad vygenerován 2025-03-25	2025-03-25 15:24:55.939813+01	2025-03-27 21:07:59.179493+01	2025-03-25	2025-03-25
13	2	INV-ZAK-250323-143-20250325	2025-03-25 00:00:00+01	1710.04	f	created	Fakturační podklad vygenerován 2025-03-25	2025-03-25 15:25:25.79652+01	2025-03-27 21:07:59.179493+01	2025-03-25	2025-03-25
14	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	7627.99	f	created	Fakturační podklad vygenerován 2025-03-26	2025-03-26 19:48:20.841299+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
15	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	7627.99	t	created	Fakturační podklad vygenerován 2025-03-26	2025-03-26 19:48:28.083042+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
16	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	7627.99	t	created	Fakturační podklad vygenerován 2025-03-26	2025-03-26 19:48:28.704716+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
17	2	INV-ZAK-250323-143-20250327	2025-03-27 00:00:00+01	3917.60	f	created	Fakturační podklad vygenerován 2025-03-27	2025-03-27 15:20:46.214177+01	2025-03-27 21:07:59.179493+01	2025-03-27	2025-03-27
18	2	INV-ZAK-250323-143-20250330	2025-03-30 00:00:00+01	6760.64	f	created	Fakturační podklad vygenerován 2025-03-27	2025-03-27 16:07:09.600957+01	2025-03-27 21:07:59.179493+01	2025-03-30	2025-03-30
19	3	INV-ZAK-250327-244-20250327	2025-03-27 00:00:00+01	849.98	f	created	Fakturační podklad vygenerován 2025-03-27	2025-03-27 21:43:51.744528+01	2025-03-27 21:43:51.744528+01	2025-03-26	2025-03-27
20	1	INV-ZAK-250323-794-20250330	2025-03-30 00:00:00+01	174.81	f	created	Fakturační podklad vygenerován 2025-03-28	2025-03-28 07:20:14.660771+01	2025-03-28 07:20:14.660771+01	2025-03-27	2025-03-30
21	3	INV-ZAK-250327-244-20250401	2025-04-01 00:00:00+02	1843.56	f	created	Fakturační podklad vygenerován 2025-04-01	2025-04-01 20:59:29.532767+02	2025-04-01 20:59:29.532767+02	2025-03-28	2025-04-01
22	3	INV-ZAK-250327-244-20250403	2025-04-03 00:00:00+02	1705.08	f	created	Fakturační podklad vygenerován 2025-04-03	2025-04-03 22:07:22.263203+02	2025-04-03 22:07:22.263203+02	2025-04-02	2025-04-03
\.


--
-- Data for Name: billing_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_items (id, billing_data_id, rental_id, equipment_id, description, days, quantity, price_per_day, total_price, created_at, updated_at) FROM stdin;
1	7	1	2	katud (567)	2	1	789.00	1578.00	2025-03-24 17:03:43.386842+01	2025-03-24 17:03:43.386842+01
2	7	2	1	testete (1234)	2	1	56.00	112.00	2025-03-24 17:03:43.39596+01	2025-03-24 17:03:43.39596+01
3	7	3	37	Tlaková podložka Frami  (INV033)	2	2	0.29	1.16	2025-03-24 17:03:43.396819+01	2025-03-24 17:03:43.396819+01
4	7	4	9	Frami Xlife 0,30x1,50m (INV005)	2	3	28.29	169.74	2025-03-24 17:03:43.398483+01	2025-03-24 17:03:43.398483+01
5	7	5	16	Frami Vnější roh 1,50m (INV012)	2	1	17.64	35.28	2025-03-24 17:03:43.39929+01	2025-03-24 17:03:43.39929+01
6	7	6	5	Frami Xlife 0,45x1,20m (INV001)	2	4	27.31	218.48	2025-03-24 17:03:43.400452+01	2025-03-24 17:03:43.400452+01
7	7	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-24 17:03:43.401073+01	2025-03-24 17:03:43.401073+01
8	8	1	2	katud (567)	2	1	789.00	1578.00	2025-03-24 17:08:41.185106+01	2025-03-24 17:08:41.185106+01
9	8	2	1	testete (1234)	2	1	56.00	112.00	2025-03-24 17:08:41.188471+01	2025-03-24 17:08:41.188471+01
10	8	3	37	Tlaková podložka Frami  (INV033)	2	2	0.29	1.16	2025-03-24 17:08:41.189814+01	2025-03-24 17:08:41.189814+01
11	8	4	9	Frami Xlife 0,30x1,50m (INV005)	2	3	28.29	169.74	2025-03-24 17:08:41.191037+01	2025-03-24 17:08:41.191037+01
12	8	5	16	Frami Vnější roh 1,50m (INV012)	2	1	17.64	35.28	2025-03-24 17:08:41.192224+01	2025-03-24 17:08:41.192224+01
13	8	6	5	Frami Xlife 0,45x1,20m (INV001)	2	4	27.31	218.48	2025-03-24 17:08:41.193247+01	2025-03-24 17:08:41.193247+01
14	8	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-24 17:08:41.194322+01	2025-03-24 17:08:41.194322+01
15	8	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-24 17:08:41.195368+01	2025-03-24 17:08:41.195368+01
16	9	2	1	testete (1234)	3	1	56.00	168.00	2025-03-25 15:23:54.55166+01	2025-03-25 15:23:54.55166+01
17	9	4	9	Frami Xlife 0,30x1,50m (INV005)	3	3	28.29	254.61	2025-03-25 15:23:54.555154+01	2025-03-25 15:23:54.555154+01
18	9	5	16	Frami Vnější roh 1,50m (INV012)	3	1	17.64	52.92	2025-03-25 15:23:54.55904+01	2025-03-25 15:23:54.55904+01
19	9	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-25 15:23:54.560858+01	2025-03-25 15:23:54.560858+01
20	9	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-25 15:23:54.562282+01	2025-03-25 15:23:54.562282+01
21	9	1	2	katud (567)	1	1	789.00	789.00	2025-03-25 15:23:54.56317+01	2025-03-25 15:23:54.56317+01
22	9	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-25 15:23:54.5637+01	2025-03-25 15:23:54.5637+01
23	9	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-25 15:23:54.565816+01	2025-03-25 15:23:54.565816+01
24	10	2	1	testete (1234)	3	1	56.00	168.00	2025-03-25 15:24:19.442623+01	2025-03-25 15:24:19.442623+01
25	10	4	9	Frami Xlife 0,30x1,50m (INV005)	3	3	28.29	254.61	2025-03-25 15:24:19.443221+01	2025-03-25 15:24:19.443221+01
26	10	5	16	Frami Vnější roh 1,50m (INV012)	3	1	17.64	52.92	2025-03-25 15:24:19.443837+01	2025-03-25 15:24:19.443837+01
27	10	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-25 15:24:19.444837+01	2025-03-25 15:24:19.444837+01
28	10	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-25 15:24:19.445303+01	2025-03-25 15:24:19.445303+01
29	10	1	2	katud (567)	1	1	789.00	789.00	2025-03-25 15:24:19.445789+01	2025-03-25 15:24:19.445789+01
30	10	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-25 15:24:19.446169+01	2025-03-25 15:24:19.446169+01
31	10	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-25 15:24:19.446839+01	2025-03-25 15:24:19.446839+01
32	11	1	2	katud (567)	1	1	789.00	789.00	2025-03-25 15:24:42.485304+01	2025-03-25 15:24:42.485304+01
33	11	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-25 15:24:42.486888+01	2025-03-25 15:24:42.486888+01
34	11	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-25 15:24:42.487829+01	2025-03-25 15:24:42.487829+01
35	11	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-25 15:24:42.488589+01	2025-03-25 15:24:42.488589+01
36	11	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-25 15:24:42.489338+01	2025-03-25 15:24:42.489338+01
37	12	2	1	testete (1234)	3	1	56.00	168.00	2025-03-25 15:24:55.942441+01	2025-03-25 15:24:55.942441+01
38	12	4	9	Frami Xlife 0,30x1,50m (INV005)	3	3	28.29	254.61	2025-03-25 15:24:55.943587+01	2025-03-25 15:24:55.943587+01
39	12	5	16	Frami Vnější roh 1,50m (INV012)	3	1	17.64	52.92	2025-03-25 15:24:55.944403+01	2025-03-25 15:24:55.944403+01
40	12	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-25 15:24:55.944811+01	2025-03-25 15:24:55.944811+01
41	12	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-25 15:24:55.945363+01	2025-03-25 15:24:55.945363+01
42	12	1	2	katud (567)	1	1	789.00	789.00	2025-03-25 15:24:55.945908+01	2025-03-25 15:24:55.945908+01
43	12	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-25 15:24:55.946415+01	2025-03-25 15:24:55.946415+01
44	12	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-25 15:24:55.946837+01	2025-03-25 15:24:55.946837+01
45	13	5	16	Frami Vnější roh 1,50m (INV012)	2	1	17.64	35.28	2025-03-25 15:25:25.797879+01	2025-03-25 15:25:25.797879+01
46	13	4	9	Frami Xlife 0,30x1,50m (INV005)	2	3	28.29	169.74	2025-03-25 15:25:25.800448+01	2025-03-25 15:25:25.800448+01
47	13	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-25 15:25:25.801663+01	2025-03-25 15:25:25.801663+01
48	13	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-25 15:25:25.802938+01	2025-03-25 15:25:25.802938+01
49	13	1	2	katud (567)	1	1	789.00	789.00	2025-03-25 15:25:25.803665+01	2025-03-25 15:25:25.803665+01
50	13	2	1	testete (1234)	2	1	56.00	112.00	2025-03-25 15:25:25.804376+01	2025-03-25 15:25:25.804376+01
51	13	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-25 15:25:25.805321+01	2025-03-25 15:25:25.805321+01
52	13	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-25 15:25:25.805753+01	2025-03-25 15:25:25.805753+01
53	17	4	9	Frami Xlife 0,30x1,50m (INV005)	2	3	28.29	169.74	2025-03-27 15:20:46.218061+01	2025-03-27 15:20:46.218061+01
54	17	5	16	Frami Vnější roh 1,50m (INV012)	2	1	17.64	35.28	2025-03-27 15:20:46.220943+01	2025-03-27 15:20:46.220943+01
55	17	1	2	katud (567)	1	1	789.00	789.00	2025-03-27 15:20:46.221596+01	2025-03-27 15:20:46.221596+01
56	17	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-27 15:20:46.222334+01	2025-03-27 15:20:46.222334+01
57	17	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-27 15:20:46.223048+01	2025-03-27 15:20:46.223048+01
58	17	2	1	testete (1234)	2	1	56.00	112.00	2025-03-27 15:20:46.224138+01	2025-03-27 15:20:46.224138+01
59	17	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-27 15:20:46.225038+01	2025-03-27 15:20:46.225038+01
60	17	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-27 15:20:46.225712+01	2025-03-27 15:20:46.225712+01
61	17	9	16	Frami Vnější roh 1,50m (INV012)	2	10	17.64	352.80	2025-03-27 15:20:46.226804+01	2025-03-27 15:20:46.226804+01
62	17	10	10	Frami Xlife 0,45x1,50m (INV006)	2	4	31.04	248.32	2025-03-27 15:20:46.228169+01	2025-03-27 15:20:46.228169+01
63	17	15	14	Frami Xlife 0,90x1,50m (INV010)	2	5	41.47	414.70	2025-03-27 15:20:46.228758+01	2025-03-27 15:20:46.228758+01
64	17	13	16	Frami Vnější roh 1,50m (INV012)	2	3	17.64	105.84	2025-03-27 15:20:46.229143+01	2025-03-27 15:20:46.229143+01
65	17	11	22	Frami Xlife 0,90x2,70m (INV018)	2	1	61.66	123.32	2025-03-27 15:20:46.229558+01	2025-03-27 15:20:46.229558+01
66	17	12	12	Frami Xlife 0,75x1,50m (INV008)	2	7	38.50	539.00	2025-03-27 15:20:46.230268+01	2025-03-27 15:20:46.230268+01
67	17	14	6	Frami Xlife 0,60x1,20m (INV002)	2	5	32.64	326.40	2025-03-27 15:20:46.231906+01	2025-03-27 15:20:46.231906+01
68	17	16	9	Frami Xlife 0,30x1,50m (INV005)	1	1	28.29	28.29	2025-03-27 15:20:46.233546+01	2025-03-27 15:20:46.233546+01
69	17	17	9	Frami Xlife 0,30x1,50m (INV005)	1	1	28.29	28.29	2025-03-27 15:20:46.234676+01	2025-03-27 15:20:46.234676+01
70	17	18	17	Frami Xlife 0,30x2,70m (INV013)	1	1	40.60	40.60	2025-03-27 15:20:46.235546+01	2025-03-27 15:20:46.235546+01
71	18	4	9	Frami Xlife 0,30x1,50m (INV005)	2	3	28.29	169.74	2025-03-27 16:07:09.61022+01	2025-03-27 16:07:09.61022+01
72	18	5	16	Frami Vnější roh 1,50m (INV012)	2	1	17.64	35.28	2025-03-27 16:07:09.612776+01	2025-03-27 16:07:09.612776+01
73	18	1	2	katud (567)	1	1	789.00	789.00	2025-03-27 16:07:09.628207+01	2025-03-27 16:07:09.628207+01
74	18	3	37	Tlaková podložka Frami  (INV033)	1	2	0.29	0.58	2025-03-27 16:07:09.629626+01	2025-03-27 16:07:09.629626+01
75	18	6	5	Frami Xlife 0,45x1,20m (INV001)	1	4	27.31	109.24	2025-03-27 16:07:09.630455+01	2025-03-27 16:07:09.630455+01
76	18	2	1	testete (1234)	2	1	56.00	112.00	2025-03-27 16:07:09.631601+01	2025-03-27 16:07:09.631601+01
77	18	8	16	Frami Vnější roh 1,50m (INV012)	1	5	17.64	88.20	2025-03-27 16:07:09.632213+01	2025-03-27 16:07:09.632213+01
78	18	7	17	Frami Xlife 0,30x2,70m (INV013)	1	10	40.60	406.00	2025-03-27 16:07:09.632662+01	2025-03-27 16:07:09.632662+01
79	18	9	16	Frami Vnější roh 1,50m (INV012)	2	10	17.64	352.80	2025-03-27 16:07:09.633488+01	2025-03-27 16:07:09.633488+01
80	18	10	10	Frami Xlife 0,45x1,50m (INV006)	5	4	31.04	620.80	2025-03-27 16:07:09.634168+01	2025-03-27 16:07:09.634168+01
81	18	15	14	Frami Xlife 0,90x1,50m (INV010)	5	5	41.47	1036.75	2025-03-27 16:07:09.6348+01	2025-03-27 16:07:09.6348+01
82	18	13	16	Frami Vnější roh 1,50m (INV012)	5	3	17.64	264.60	2025-03-27 16:07:09.635584+01	2025-03-27 16:07:09.635584+01
83	18	11	22	Frami Xlife 0,90x2,70m (INV018)	5	1	61.66	308.30	2025-03-27 16:07:09.637108+01	2025-03-27 16:07:09.637108+01
84	18	12	12	Frami Xlife 0,75x1,50m (INV008)	5	7	38.50	1347.50	2025-03-27 16:07:09.638497+01	2025-03-27 16:07:09.638497+01
85	18	14	6	Frami Xlife 0,60x1,20m (INV002)	5	5	32.64	816.00	2025-03-27 16:07:09.639119+01	2025-03-27 16:07:09.639119+01
86	18	16	9	Frami Xlife 0,30x1,50m (INV005)	1	1	28.29	28.29	2025-03-27 16:07:09.64135+01	2025-03-27 16:07:09.64135+01
87	18	17	9	Frami Xlife 0,30x1,50m (INV005)	4	1	28.29	113.16	2025-03-27 16:07:09.64198+01	2025-03-27 16:07:09.64198+01
88	18	18	17	Frami Xlife 0,30x2,70m (INV013)	4	1	40.60	162.40	2025-03-27 16:07:09.642628+01	2025-03-27 16:07:09.642628+01
89	19	24	32	Držák kotevní tyče Frami (INV028)	1	1	0.58	0.58	2025-03-27 21:43:51.751836+01	2025-03-27 21:43:51.751836+01
90	19	26	9	Frami Xlife 0,30x1,50m (INV005)	1	1	28.29	28.29	2025-03-27 21:43:51.754271+01	2025-03-27 21:43:51.754271+01
91	19	27	5	Frami Xlife 0,45x1,20m (INV001)	1	1	27.31	27.31	2025-03-27 21:43:51.755316+01	2025-03-27 21:43:51.755316+01
92	19	25	16	Frami Vnější roh 1,50m (INV012)	1	1	17.64	17.64	2025-03-27 21:43:51.756025+01	2025-03-27 21:43:51.756025+01
93	19	22	16	Frami Vnější roh 1,50m (INV012)	1	13	17.64	229.32	2025-03-27 21:43:51.756941+01	2025-03-27 21:43:51.756941+01
94	19	23	16	Frami Vnější roh 1,50m (INV012)	1	31	17.64	546.84	2025-03-27 21:43:51.757678+01	2025-03-27 21:43:51.757678+01
95	20	30	30	Upínací kolejnice Frami 0,70 (INV026)	3	1	2.67	8.01	2025-03-28 07:20:14.662132+01	2025-03-28 07:20:14.662132+01
96	20	28	9	Frami Xlife 0,30x1,50m (INV005)	3	1	28.29	84.87	2025-03-28 07:20:14.663264+01	2025-03-28 07:20:14.663264+01
97	20	29	5	Frami Xlife 0,45x1,20m (INV001)	3	1	27.31	81.93	2025-03-28 07:20:14.663795+01	2025-03-28 07:20:14.663795+01
98	21	25	16	Frami Vnější roh 1,50m (INV012)	1	1	17.64	17.64	2025-04-01 20:59:29.538411+02	2025-04-01 20:59:29.538411+02
99	21	27	5	Frami Xlife 0,45x1,20m (INV001)	1	1	27.31	27.31	2025-04-01 20:59:29.542838+02	2025-04-01 20:59:29.542838+02
100	21	24	32	Držák kotevní tyče Frami (INV028)	1	1	0.58	0.58	2025-04-01 20:59:29.544546+02	2025-04-01 20:59:29.544546+02
101	21	26	9	Frami Xlife 0,30x1,50m (INV005)	1	1	28.29	28.29	2025-04-01 20:59:29.545997+02	2025-04-01 20:59:29.545997+02
102	21	33	26	Jeřábové oko Frami  (INV022)	1	1	6.31	6.31	2025-04-01 20:59:29.547197+02	2025-04-01 20:59:29.547197+02
103	21	31	10	Frami Xlife 0,45x1,50m (INV006)	1	1	31.04	31.04	2025-04-01 20:59:29.548299+02	2025-04-01 20:59:29.548299+02
104	21	32	5	Frami Xlife 0,45x1,20m (INV001)	1	1	27.31	27.31	2025-04-01 20:59:29.549462+02	2025-04-01 20:59:29.549462+02
105	21	37	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-01 20:59:29.550345+02	2025-04-01 20:59:29.550345+02
106	21	38	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-01 20:59:29.550969+02	2025-04-01 20:59:29.550969+02
107	21	39	16	Frami Vnější roh 1,50m (INV012)	1	72	17.64	1270.08	2025-04-01 20:59:29.551829+02	2025-04-01 20:59:29.551829+02
108	21	35	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-01 20:59:29.552339+02	2025-04-01 20:59:29.552339+02
109	21	34	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-01 20:59:29.552818+02	2025-04-01 20:59:29.552818+02
110	21	36	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-01 20:59:29.55397+02	2025-04-01 20:59:29.55397+02
111	22	39	16	Frami Vnější roh 1,50m (INV012)	1	72	17.64	1270.08	2025-04-03 22:07:22.272781+02	2025-04-03 22:07:22.272781+02
112	22	38	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-03 22:07:22.27797+02	2025-04-03 22:07:22.27797+02
113	22	37	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-03 22:07:22.279129+02	2025-04-03 22:07:22.279129+02
114	22	35	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-03 22:07:22.280182+02	2025-04-03 22:07:22.280182+02
115	22	34	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-03 22:07:22.281628+02	2025-04-03 22:07:22.281628+02
116	22	36	32	Držák kotevní tyče Frami (INV028)	1	150	0.58	87.00	2025-04-03 22:07:22.282333+02	2025-04-03 22:07:22.282333+02
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, type, name, email, phone, address, ico, dic, customer_category, credit, created_at, updated_at) FROM stdin;
1	company	tester	lukas.holubcak@gmail.com	608213323	kjjkb	1234556778	12345678	regular	0.00	2025-03-23 17:20:35.859563+01	2025-03-23 17:20:35.859563+01
2	individual	kjhknj	ggg@jj.cz	608213323		456789		regular	0.00	2025-03-23 18:35:22.584565+01	2025-03-23 18:35:22.584565+01
3	individual	Lukáš Holubčák	lukas.holubcak@gmail.com	608213323				regular	0.00	2025-03-27 21:35:58.840299+01	2025-03-27 21:35:58.840299+01
\.


--
-- Data for Name: delivery_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_notes (id, order_id, delivery_note_number, issue_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment (id, name, category_id, inventory_number, purchase_price, daily_rate, status, location, description, photo_url, created_at, updated_at, article_number, product_designation, material_value, monthly_rate, weight_per_piece, square_meters_per_piece, total_stock, total_square_meters, is_external, supplier_id, external_rental_cost, rental_start_date, rental_end_date, external_reference, return_date, rental_status, warehouse_id) FROM stdin;
4	tetstt	12	1234567	678.00	56.00	available			/uploads/equipment-1742755156498-47964676.jpeg	2025-03-23 19:39:16.543201+01	2025-03-23 19:39:16.543201+01	34567	HGG	576.30	890.00	56.00	56.00	800	44800.00	f	\N	\N	\N	\N	\N	\N	active	1
6	Frami Xlife 0,60x1,20m	16	INV002	14828.00	32.64	available	Sklad A	\N	\N	2025-03-23 20:36:07.906234+01	2025-03-23 20:36:07.906234+01	588463500	\N	12603.80	979.20	29.50	0.72	8	5.76	f	\N	\N	\N	\N	\N	\N	active	1
7	Vnější roh Frami 1,20m	16	INV003	6506.00	14.94	available	Sklad A	\N	\N	2025-03-23 20:36:07.907725+01	2025-03-23 20:36:07.907725+01	588459000	\N	5530.10	448.20	11.00	\N	2	\N	f	\N	\N	\N	\N	\N	\N	active	1
8	Vnitřní roh Frami 1,20m 20cm	16	INV004	11770.00	26.81	available	Sklad A	\N	\N	2025-03-23 20:36:07.9086+01	2025-03-23 20:36:07.9086+01	588471000	\N	10004.50	804.30	25.30	0.05	2	0.10	f	\N	\N	\N	\N	\N	\N	active	1
11	Frami Xlife 0,60x1,50m	16	INV007	16469.00	36.26	available	Sklad A	\N	\N	2025-03-23 20:36:07.911872+01	2025-03-23 20:36:07.911872+01	588464500	\N	13998.65	1087.80	35.50	0.90	27	24.30	f	\N	\N	\N	\N	\N	\N	active	1
13	Frami Xlife 0,75x1,50m UNI	16	INV009	21052.00	46.38	available	Sklad A	\N	\N	2025-03-23 20:36:07.914269+01	2025-03-23 20:36:07.914269+01	588407500	\N	17894.20	1391.40	49.50	1.13	16	18.00	f	\N	\N	\N	\N	\N	\N	active	1
14	Frami Xlife 0,90x1,50m	16	INV010	18829.00	41.47	available	Sklad A	\N	\N	2025-03-23 20:36:07.915405+01	2025-03-23 20:36:07.915405+01	588406500	\N	16004.65	1244.10	46.50	1.35	80	108.00	f	\N	\N	\N	\N	\N	\N	active	1
15	Vnitřní roh Frami 1,50m 20cm	16	INV011	13564.00	29.89	available	Sklad A	\N	\N	2025-03-23 20:36:07.916964+01	2025-03-23 20:36:07.916964+01	588472000	\N	11529.40	896.70	30.70	0.60	10	6.00	f	\N	\N	\N	\N	\N	\N	active	1
18	Frami Xlife 0,45x2,70m	16	INV014	20444.00	45.02	available	Sklad A	\N	\N	2025-03-23 20:36:07.922106+01	2025-03-23 20:36:07.922106+01	588482500	\N	17377.40	1350.60	49.50	1.22	32	38.88	f	\N	\N	\N	\N	\N	\N	active	1
19	Frami Xlife 0,60x2,70m	16	INV015	23591.00	51.87	available	Sklad A	\N	\N	2025-03-23 20:36:07.923374+01	2025-03-23 20:36:07.923374+01	588465500	\N	20052.35	1556.10	60.50	1.62	28	45.36	f	\N	\N	\N	\N	\N	\N	active	1
20	Frami Xlife 0,75x2,70m	16	INV016	25558.00	56.20	available	Sklad A	\N	\N	2025-03-23 20:36:07.924234+01	2025-03-23 20:36:07.924234+01	588449500	\N	21724.30	1686.00	69.50	2.03	7	14.17	f	\N	\N	\N	\N	\N	\N	active	1
21	Frami Xlife 0,75x2,70m UNI	16	INV017	31691.00	69.81	available	Sklad A	\N	\N	2025-03-23 20:36:07.925103+01	2025-03-23 20:36:07.925103+01	588484500	\N	26937.35	2094.30	83.50	2.03	3	6.07	f	\N	\N	\N	\N	\N	\N	active	1
23	Frami 0,20x0,20x2,70m ROH	16	INV019	25088.00	55.24	available	Sklad A	\N	\N	2025-03-23 20:36:07.928185+01	2025-03-23 20:36:07.928185+01	588485000	\N	21324.80	1657.20	51.55	1.08	3	3.24	f	\N	\N	\N	\N	\N	\N	active	1
24	Vnější roh Frami 2,70m	16	INV020	14040.00	30.87	available	Sklad A	\N	\N	2025-03-23 20:36:07.929835+01	2025-03-23 20:36:07.929835+01	588461000	\N	11934.00	926.10	23.80	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
25	Upínací kolejnice Frami 1,25m	16	INV021	1749.00	3.96	available	Sklad A	\N	\N	2025-03-23 20:36:07.931117+01	2025-03-23 20:36:07.931117+01	588440000	\N	1486.65	118.80	6.35	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
27	Rychloupínač Frami 	16	INV023	607.00	1.24	available	Sklad A	\N	\N	2025-03-23 20:36:07.934092+01	2025-03-23 20:36:07.934092+01	588433000	\N	515.95	37.20	1.23	\N	927	\N	f	\N	\N	\N	\N	\N	\N	active	1
28	Univerzální svorka Frami 5-12cm	16	INV024	338.00	0.76	available	Sklad A	\N	\N	2025-03-23 20:36:07.935589+01	2025-03-23 20:36:07.935589+01	588479000	\N	287.30	22.80	0.43	\N	50	\N	f	\N	\N	\N	\N	\N	\N	active	1
29	Upínač pro vyrovnání Frami	16	INV025	2752.00	6.12	available	Sklad A	\N	\N	2025-03-23 20:36:07.937247+01	2025-03-23 20:36:07.937247+01	588436000	\N	2339.20	183.60	3.60	\N	119	\N	f	\N	\N	\N	\N	\N	\N	active	1
31	Svorka Frami 	16	INV027	838.00	2.04	available	Sklad A	\N	\N	2025-03-23 20:36:07.93938+01	2025-03-23 20:36:07.93938+01	588441000	\N	712.30	61.20	1.10	\N	138	\N	f	\N	\N	\N	\N	\N	\N	active	1
33	Vyrovnávaci opěra 340 IB	16	INV029	6303.00	13.62	available	Sklad A	\N	\N	2025-03-23 20:36:07.941637+01	2025-03-23 20:36:07.941637+01	588696000	\N	5357.55	408.60	16.70	\N	19	\N	f	\N	\N	\N	\N	\N	\N	active	1
34	Vyrovnávací opěra 260 IB	16	INV030	4630.00	10.05	available	Sklad A	\N	\N	2025-03-23 20:36:07.943353+01	2025-03-23 20:36:07.943353+01	588437500	\N	3935.50	301.50	12.75	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
35	Hlava opěry EB Frami 	16	INV031	1160.00	2.49	available	Sklad A	\N	\N	2025-03-23 20:36:07.944469+01	2025-03-23 20:36:07.944469+01	588945000	\N	986.00	74.70	1.36	\N	29	\N	f	\N	\N	\N	\N	\N	\N	active	1
36	Šestihranná matka 15,0	16	INV032	186.00	0.55	available	Sklad A	\N	\N	2025-03-23 20:36:07.947506+01	2025-03-23 20:36:07.947506+01	581964000	\N	158.10	16.50	0.23	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
38	Základový upínač Frami 	16	INV034	1426.00	3.13	available	Sklad A	\N	\N	2025-03-23 20:36:07.955902+01	2025-03-23 20:36:07.955902+01	588452000	\N	1212.10	93.90	1.60	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
39	Ukládací paleta Doka 1,20x0,80m	16	INV035	7485.00	7.47	available	Sklad A	\N	\N	2025-03-23 20:36:07.957094+01	2025-03-23 20:36:07.957094+01	583016000	\N	6362.25	224.10	38.00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
40	Ukládací paleta Doka 1,55x0,85m	16	INV036	8298.00	8.17	available	Sklad A	\N	\N	2025-03-23 20:36:07.958233+01	2025-03-23 20:36:07.958233+01	586151000	\N	7053.30	245.10	41.00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
41	Víceúčelový kontejner 1,20x0,80m	16	INV037	12700.00	12.61	available	Sklad A	\N	\N	2025-03-23 20:36:07.959401+01	2025-03-23 20:36:07.959401+01	583011000	\N	10795.00	378.30	70.00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
42	Paleta Frami 1,20m	16	INV038	13199.00	15.43	available	Sklad A	\N	\N	2025-03-23 20:36:07.965541+01	2025-03-23 20:36:07.965541+01	588478000	\N	11219.15	462.90	66.00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	active	1
43	Paleta Frami 1,50m	16	INV040	13953.00	16.32	available	Sklad A	\N	\N	2025-03-23 20:36:07.966729+01	2025-03-23 20:36:07.966729+01	588476000	\N	11860.05	489.60	69.00	\N	13	\N	f	\N	\N	\N	\N	\N	\N	active	1
17	Frami Xlife 0,30x2,70m	16	INV013	18426.00	40.60	available	Sklad A	\N	\N	2025-03-23 20:36:07.920742+01	2025-03-23 20:36:07.920742+01	588483500	\N	15662.10	1218.00	38.50	0.81	22	8.10	f	\N	\N	\N	\N	\N	\N	active	1
1	testete	12	1234	678.00	56.00	available				2025-03-21 23:02:01.670308+01	2025-03-21 23:02:01.670308+01	\N	\N	\N	\N	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N	active	1
2	katud	12	567	9000.00	789.00	available				2025-03-23 16:50:53.724317+01	2025-03-23 16:50:53.724317+01	\N	\N	\N	\N	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N	active	1
37	Tlaková podložka Frami 	16	INV033	135.00	0.29	available	Sklad A	\N	\N	2025-03-23 20:36:07.948842+01	2025-03-23 20:36:07.948842+01	588466000	\N	114.75	8.70	0.55	\N	22	\N	f	\N	\N	\N	\N	\N	\N	active	1
16	Frami Vnější roh 1,50m	16	INV012	8000.00	17.64	available	Sklad A	\N	\N	2025-03-23 20:36:07.919161+01	2025-03-23 20:36:07.919161+01	588460000	\N	6800.00	529.20	12.90	\N	75	\N	f	\N	\N	\N	\N	\N	\N	active	1
30	Upínací kolejnice Frami 0,70	16	INV026	1224.00	2.67	available	Sklad A	\N	\N	2025-03-23 20:36:07.938483+01	2025-03-23 20:36:07.938483+01	588439000	\N	1040.40	80.10	3.65	\N	73	\N	f	\N	\N	\N	\N	\N	\N	active	1
9	Frami Xlife 0,30x1,50m	16	INV005	12845.00	28.29	available	Sklad A	\N	\N	2025-03-23 20:36:07.909503+01	2025-03-23 20:36:07.909503+01	588410500	\N	10918.25	848.70	24.83	0.45	34	13.50	f	\N	\N	\N	\N	\N	\N	active	1
5	Frami Xlife 0,45x1,20m	16	INV001	12400.00	27.31	available	Sklad A	\N	\N	2025-03-23 20:36:07.89827+01	2025-03-27 21:38:52.563697+01	588404500	\N	10540.00	819.30	24.00	0.54	8	2.16	f	\N	\N	\N	\N	\N	\N	active	1
22	Frami Xlife 0,90x2,70m	16	INV018	28030.00	61.66	available	Sklad A	\N	\N	2025-03-23 20:36:07.925929+01	2025-03-23 20:36:07.925929+01	588481500	\N	23825.50	1849.80	79.20	2.43	59	145.80	f	\N	\N	\N	\N	\N	\N	active	1
12	Frami Xlife 0,75x1,50m	16	INV008	17488.00	38.50	available	Sklad A	\N	\N	2025-03-23 20:36:07.913093+01	2025-03-23 20:36:07.913093+01	588448500	\N	14864.80	1155.00	41.30	1.13	5	13.50	f	\N	\N	\N	\N	\N	\N	active	1
44	TTESST	16	123456	567676.00	655.00	available	Sklad B		\N	2025-04-05 21:32:29.266562+02	2025-04-05 21:32:29.266562+02	234567	FGHJK	482524.60	555685.00	455.00	56.00	567	31752.00	f	\N	\N	\N	\N	\N	\N	active	1
32	Držák kotevní tyče Frami	16	INV028	302.00	0.58	available	Sklad A	\N	\N	2025-03-23 20:36:07.940618+01	2025-03-23 20:36:07.940618+01	588453000	\N	256.70	17.40	0.58	\N	150	\N	f	\N	\N	\N	\N	\N	\N	active	1
26	Jeřábové oko Frami 	16	INV022	6635.00	6.31	available	Sklad A	\N	\N	2025-03-23 20:36:07.9328+01	2025-03-23 20:36:07.9328+01	588438000	\N	5639.75	189.30	7.45	\N	4	\N	f	\N	\N	\N	\N	\N	\N	active	1
10	Frami Xlife 0,45x1,50m	16	INV006	14088.00	31.04	available	Sklad A	\N	\N	2025-03-23 20:36:07.910366+01	2025-03-23 20:36:07.910366+01	588409500	\N	11974.80	931.10	28.90	0.68	32	20.93	f	\N	\N	\N	\N	\N	\N	active	1
\.


--
-- Data for Name: equipment_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_categories (id, name, description, created_at, updated_at) FROM stdin;
6	Ruční nářadí	Kladiva, šroubováky, klíče, atd.	2025-03-21 22:46:55.784716+01	2025-03-21 22:46:55.784716+01
9	Lešení	Rámové lešení, mobilní věže, atd.	2025-03-21 22:46:55.784716+01	2025-03-21 22:46:55.784716+01
12	Elektrické nářadí	Vrtačky, brusky, pily, atd.	2025-03-21 22:53:30.92727+01	2025-03-21 22:53:30.92727+01
13	Stavební stroje	Míchačky, vibrační desky, atd.	2025-03-21 22:53:30.92727+01	2025-03-21 22:53:30.92727+01
16	Frami	Stěnové bednění	2025-03-23 20:30:25.516319+01	2025-03-23 20:30:25.516319+01
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, rental_id, description, days, price_per_day, total_price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, customer_id, order_id, invoice_number, issue_date, due_date, total_amount, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, order_number, creation_date, status, estimated_end_date, notes, created_at, updated_at, name) FROM stdin;
1	1	ZAK-250323-794	2025-03-23 17:45:27.688479+01	active	2025-03-27 00:00:00+01		2025-03-23 17:45:27.688479+01	2025-03-23 17:45:27.688479+01	\N
2	2	ZAK-250323-143	2025-03-23 18:35:40.894804+01	active	2025-03-25 00:00:00+01		2025-03-23 18:35:40.894804+01	2025-03-23 19:47:16.848921+01	\N
3	3	ZAK-250327-244	2025-03-27 21:36:39.010996+01	active	2026-02-26 00:00:00+01	Brno 	2025-03-27 21:36:39.010996+01	2025-03-31 12:42:06.536763+02	Rychnov
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rentals (id, order_id, equipment_id, issue_date, planned_return_date, actual_return_date, daily_rate, status, issue_condition, issue_photo_url, created_at, updated_at, quantity, note, is_billed, batch_id) FROM stdin;
7	2	17	2025-03-24 00:00:00+01	2025-03-30 00:00:00+01	2025-03-24 00:00:00+01	40.60	returned	\N	\N	2025-03-24 16:10:51.92274+01	2025-03-24 16:10:51.92274+01	10	\N	f	\N
36	3	32	2025-04-01 00:00:00+02	2025-04-26 00:00:00+02	\N	0.58	created	\N	\N	2025-04-01 20:29:52.344888+02	2025-04-01 20:29:52.344888+02	150	\N	f	ISSUE-20250401182952-763
1	2	2	2025-03-23 00:00:00+01	\N	2025-03-24 00:00:00+01	789.00	returned	\N	\N	2025-03-23 18:38:00.702851+01	2025-03-23 18:38:00.702851+01	1	\N	f	\N
3	2	37	2025-03-23 00:00:00+01	2025-03-30 00:00:00+01	2025-03-24 00:00:00+01	0.29	returned	\N	\N	2025-03-23 21:39:18.575603+01	2025-03-23 21:39:18.575603+01	2	\N	f	\N
6	2	5	2025-03-23 00:00:00+01	2025-03-30 00:00:00+01	2025-03-24 00:00:00+01	27.31	returned	\N	\N	2025-03-23 21:41:43.927118+01	2025-03-23 21:41:43.927118+01	4	\N	f	\N
8	2	16	2025-03-24 00:00:00+01	2025-03-30 00:00:00+01	2025-03-25 00:00:00+01	17.64	returned	\N	\N	2025-03-24 17:05:30.504192+01	2025-03-24 17:05:30.504192+01	5	\N	f	\N
2	2	1	2025-03-23 00:00:00+01	\N	2025-03-25 00:00:00+01	56.00	returned	\N	\N	2025-03-23 18:38:14.623691+01	2025-03-23 18:38:14.623691+01	1	\N	f	\N
5	2	16	2025-03-23 00:00:00+01	2025-03-30 00:00:00+01	2025-03-25 00:00:00+01	17.64	returned	\N	\N	2025-03-23 21:39:18.594309+01	2025-03-23 21:39:18.594309+01	1	\N	f	\N
4	2	9	2025-03-23 00:00:00+01	2025-03-30 00:00:00+01	2025-03-25 00:00:00+01	28.29	returned	\N	\N	2025-03-23 21:39:18.589366+01	2025-03-23 21:39:18.589366+01	3	\N	f	\N
11	2	22	2025-03-26 00:00:00+01	2025-05-09 00:00:00+02	\N	61.66	issued	\N	\N	2025-03-26 17:29:00.560013+01	2025-03-26 17:29:00.560013+01	1	\N	f	\N
12	2	12	2025-03-26 00:00:00+01	2025-05-09 00:00:00+02	\N	38.50	issued	\N	\N	2025-03-26 17:29:00.568345+01	2025-03-26 17:29:00.568345+01	7	\N	f	\N
13	2	16	2025-03-26 00:00:00+01	2025-04-30 00:00:00+02	\N	17.64	created	\N	\N	2025-03-26 19:21:24.758297+01	2025-03-26 19:21:24.758297+01	3	\N	f	\N
14	2	6	2025-03-26 00:00:00+01	2025-04-30 00:00:00+02	\N	32.64	created	\N	\N	2025-03-26 19:21:24.771311+01	2025-03-26 19:21:24.771311+01	5	\N	f	\N
15	2	14	2025-03-26 00:00:00+01	2025-04-30 00:00:00+02	\N	41.47	created	\N	\N	2025-03-26 19:21:24.777069+01	2025-03-26 19:21:24.777069+01	5	\N	f	\N
10	2	10	2025-03-26 00:00:00+01	2025-05-09 00:00:00+02	\N	31.04	issued	\N	\N	2025-03-26 17:29:00.542417+01	2025-03-26 17:29:00.542417+01	4	\N	f	\N
16	2	9	2025-03-27 00:00:00+01	2025-05-08 00:00:00+02	2025-03-27 00:00:00+01	28.29	returned	\N	\N	2025-03-27 15:17:33.800111+01	2025-03-27 15:17:33.800111+01	1	\N	f	ISSUE-20250327141733-650
9	2	16	2025-03-25 00:00:00+01	2025-05-31 00:00:00+02	2025-03-27 00:00:00+01	17.64	returned	\N	\N	2025-03-25 15:26:09.369149+01	2025-03-25 15:26:09.369149+01	10	\N	f	\N
17	2	9	2025-03-27 00:00:00+01	2025-05-08 00:00:00+02	2025-03-27 00:00:00+01	28.29	returned	\N	\N	2025-03-27 15:17:33.817791+01	2025-03-27 15:17:33.817791+01	1	\N	f	ISSUE-20250327141733-650
18	2	17	2025-03-27 00:00:00+01	2025-05-08 00:00:00+02	2025-03-27 00:00:00+01	40.60	returned	\N	\N	2025-03-27 15:17:33.82403+01	2025-03-27 15:17:33.82403+01	1	\N	f	ISSUE-20250327141733-650
19	2	17	2025-03-27 00:00:00+01	2025-03-30 00:00:00+01	2025-03-27 00:00:00+01	40.60	returned	\N	\N	2025-03-27 20:38:58.216984+01	2025-03-27 20:38:58.216984+01	1	\N	f	ISSUE-20250327193858-347
20	2	10	2025-03-27 00:00:00+01	2025-03-30 00:00:00+01	2025-03-27 00:00:00+01	31.04	returned	\N	\N	2025-03-27 20:38:58.232093+01	2025-03-27 20:38:58.232093+01	4	\N	f	ISSUE-20250327193858-347
21	2	26	2025-03-27 00:00:00+01	2025-03-30 00:00:00+01	2025-03-27 00:00:00+01	6.31	returned	\N	\N	2025-03-27 20:38:58.238465+01	2025-03-27 20:38:58.238465+01	1	\N	f	ISSUE-20250327193858-347
23	3	16	2025-03-27 00:00:00+01	2025-06-21 00:00:00+02	2025-03-27 00:00:00+01	17.64	returned	\N	\N	2025-03-27 21:39:57.129372+01	2025-03-27 21:39:57.129372+01	31	\N	f	ISSUE-20250327203957-459
22	3	16	2025-03-27 00:00:00+01	2025-08-31 00:00:00+02	2025-03-27 00:00:00+01	17.64	returned	\N	\N	2025-03-27 21:37:24.153886+01	2025-03-27 21:37:24.153886+01	13	\N	f	ISSUE-20250327203724-163
24	3	32	2025-03-27 00:00:00+01	2025-06-27 00:00:00+02	2025-03-28 00:00:00+01	0.58	returned	\N	\N	2025-03-27 21:42:25.880766+01	2025-03-27 21:42:25.880766+01	1	\N	f	ISSUE-20250327204225-349
25	3	16	2025-03-27 00:00:00+01	2025-06-27 00:00:00+02	2025-03-28 00:00:00+01	17.64	returned	\N	\N	2025-03-27 21:42:25.889476+01	2025-03-27 21:42:25.889476+01	1	\N	f	ISSUE-20250327204225-349
26	3	9	2025-03-27 00:00:00+01	2025-06-27 00:00:00+02	2025-03-28 00:00:00+01	28.29	returned	\N	\N	2025-03-27 21:42:25.896176+01	2025-03-27 21:42:25.896176+01	1	\N	f	ISSUE-20250327204225-349
27	3	5	2025-03-27 00:00:00+01	2025-06-27 00:00:00+02	2025-03-28 00:00:00+01	27.31	returned	\N	\N	2025-03-27 21:42:25.90328+01	2025-03-27 21:42:25.90328+01	1	\N	f	ISSUE-20250327204225-349
28	1	9	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	\N	28.29	issued	\N	\N	2025-03-28 07:20:09.169279+01	2025-03-28 07:20:09.169279+01	1	\N	f	ISSUE-20250328062009-223
29	1	5	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	\N	27.31	issued	\N	\N	2025-03-28 07:20:09.182381+01	2025-03-28 07:20:09.182381+01	1	\N	f	ISSUE-20250328062009-223
30	1	30	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	\N	2.67	issued	\N	\N	2025-03-28 07:20:09.18754+01	2025-03-28 07:20:09.18754+01	1	\N	f	ISSUE-20250328062009-223
31	3	10	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	2025-03-28 00:00:00+01	31.04	returned	\N	\N	2025-03-28 07:32:56.039259+01	2025-03-28 07:32:56.039259+01	1	\N	f	ISSUE-20250328063256-111
32	3	5	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	2025-03-28 00:00:00+01	27.31	returned	\N	\N	2025-03-28 07:32:56.054136+01	2025-03-28 07:32:56.054136+01	1	\N	f	ISSUE-20250328063256-111
33	3	26	2025-03-28 00:00:00+01	2025-06-30 00:00:00+02	2025-03-28 00:00:00+01	6.31	returned	\N	\N	2025-03-28 07:32:56.063001+01	2025-03-28 07:32:56.063001+01	1	\N	f	ISSUE-20250328063256-111
34	3	32	2025-04-01 00:00:00+02	2025-04-25 00:00:00+02	\N	0.58	created	\N	\N	2025-04-01 20:15:45.145317+02	2025-04-01 20:15:45.145317+02	150	\N	f	ISSUE-20250401181545-856
35	3	32	2025-04-01 00:00:00+02	2025-04-25 00:00:00+02	\N	0.58	created	\N	\N	2025-04-01 20:15:45.163423+02	2025-04-01 20:15:45.163423+02	150	\N	f	ISSUE-20250401181545-856
37	3	32	2025-04-01 00:00:00+02	2025-04-19 00:00:00+02	\N	0.58	created	\N	\N	2025-04-01 20:42:05.726233+02	2025-04-01 20:42:05.726233+02	150	\N	f	ISSUE-20250401184205-147
38	3	32	2025-04-01 00:00:00+02	2025-04-18 00:00:00+02	\N	0.58	created	\N	\N	2025-04-01 20:43:05.553451+02	2025-04-01 20:43:05.553451+02	150	\N	f	ISSUE-20250401184305-449
39	3	16	2025-04-01 00:00:00+02	2025-04-17 00:00:00+02	\N	17.64	created	\N	\N	2025-04-01 20:48:56.588394+02	2025-04-01 20:48:56.588394+02	72	\N	f	ISSUE-20250401184856-286
40	3	23	2025-04-03 00:00:00+02	2025-04-30 00:00:00+02	\N	55.24	created	\N	\N	2025-04-03 22:17:02.702933+02	2025-04-03 22:17:02.702933+02	3	\N	f	ISSUE-20250403201702-403
41	3	9	2025-04-05 00:00:00+02	2025-04-30 00:00:00+02	\N	28.29	created	\N	\N	2025-04-05 20:21:00.144678+02	2025-04-05 20:21:00.144678+02	10	\N	f	ISSUE-20250405182100-582
42	3	17	2025-04-05 00:00:00+02	2025-04-30 00:00:00+02	\N	40.60	created	\N	\N	2025-04-05 20:21:00.162909+02	2025-04-05 20:21:00.162909+02	10	\N	f	ISSUE-20250405182100-582
43	3	5	2025-04-05 00:00:00+02	2025-04-30 00:00:00+02	\N	27.31	created	\N	\N	2025-04-05 20:21:00.173405+02	2025-04-05 20:21:00.173405+02	5	\N	f	ISSUE-20250405182100-582
44	3	10	2025-04-05 00:00:00+02	2025-04-30 00:00:00+02	\N	31.04	created	\N	\N	2025-04-05 20:21:00.18248+02	2025-04-05 20:21:00.18248+02	28	\N	f	ISSUE-20250405182100-582
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.returns (id, rental_id, return_date, condition, damage_description, damage_photo_url, additional_charges, notes, created_at, updated_at, quantity, batch_id) FROM stdin;
1	7	2025-03-24 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-24 16:11:35.961325+01	2025-03-24 16:11:35.961325+01	10	\N
2	8	2025-03-24 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-24 17:07:53.929528+01	2025-03-24 17:07:53.929528+01	5	\N
3	1	2025-03-24 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-24 19:55:02.248876+01	2025-03-24 19:55:02.248876+01	1	\N
4	3	2025-03-24 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-24 19:55:09.878582+01	2025-03-24 19:55:09.878582+01	2	\N
5	6	2025-03-24 00:00:00+01	damaged	\N	\N	0.00	\N	2025-03-24 19:56:16.104834+01	2025-03-24 19:56:16.104834+01	4	\N
6	8	2025-03-25 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-25 15:23:41.984109+01	2025-03-25 15:23:41.984109+01	5	\N
7	2	2025-03-25 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-25 15:25:12.790512+01	2025-03-25 15:25:12.790512+01	1	\N
8	5	2025-03-25 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-25 15:25:16.30756+01	2025-03-25 15:25:16.30756+01	1	\N
9	4	2025-03-25 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-25 15:25:18.520016+01	2025-03-25 15:25:18.520016+01	3	\N
10	10	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 15:18:15.559916+01	2025-03-27 15:18:15.559916+01	3	RETURN-20250327141808-110
11	16	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 15:18:54.532678+01	2025-03-27 15:18:54.532678+01	1	RETURN-20250327141848-289
12	9	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 15:20:32.942339+01	2025-03-27 15:20:32.942339+01	10	RETURN-20250327142030-612
13	17	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 20:43:04.911914+01	2025-03-27 20:43:04.911914+01	1	BATCH-RETURN-20250327193901-604
14	18	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 20:43:04.926892+01	2025-03-27 20:43:04.926892+01	1	BATCH-RETURN-20250327193901-604
15	19	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 20:43:04.93665+01	2025-03-27 20:43:04.93665+01	1	BATCH-RETURN-20250327193901-604
16	20	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 20:43:04.945099+01	2025-03-27 20:43:04.945099+01	4	BATCH-RETURN-20250327193901-604
17	21	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 20:43:04.954053+01	2025-03-27 20:43:04.954053+01	1	BATCH-RETURN-20250327193901-604
18	23	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 21:41:07.390436+01	2025-03-27 21:41:07.390436+01	31	RETURN-20250327204102-836
19	22	2025-03-27 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-27 21:41:19.202538+01	2025-03-27 21:41:19.202538+01	13	RETURN-20250327204116-656
20	24	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 07:17:36.715081+01	2025-03-28 07:17:36.715081+01	1	BATCH-RETURN-20250328061719-52
21	25	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 07:17:36.730964+01	2025-03-28 07:17:36.730964+01	1	BATCH-RETURN-20250328061719-52
22	26	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 07:17:36.74302+01	2025-03-28 07:17:36.74302+01	1	BATCH-RETURN-20250328061719-52
23	27	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 07:17:36.752939+01	2025-03-28 07:17:36.752939+01	1	BATCH-RETURN-20250328061719-52
24	31	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 09:05:45.995509+01	2025-03-28 09:05:45.995509+01	1	BATCH-RETURN-20250328080538-628
25	32	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 09:05:46.008806+01	2025-03-28 09:05:46.008806+01	1	BATCH-RETURN-20250328080538-628
26	33	2025-03-28 00:00:00+01	ok	\N	\N	0.00	\N	2025-03-28 09:05:46.01748+01	2025-03-28 09:05:46.01748+01	1	BATCH-RETURN-20250328080538-628
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact_person, email, phone, address, ico, dic, bank_account, notes, created_at, updated_at) FROM stdin;
1	test	texts	koncha-60.norky@icloud.com	608213323		1342526	CZ34565			2025-04-05 21:26:28.94372+02	2025-04-05 21:26:28.94372+02
\.


--
-- Data for Name: user_customer_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_customer_access (id, user_id, customer_id, access_type, created_at, updated_at) FROM stdin;
1	6	3	read	2025-04-05 19:30:19.39433+02	2025-04-05 19:30:19.39433+02
\.


--
-- Data for Name: user_order_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_order_access (id, user_id, order_id, access_type, created_at, updated_at) FROM stdin;
1	6	3	read	2025-04-04 14:31:48.844063+02	2025-04-04 14:31:48.844063+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, first_name, last_name, role, created_at, updated_at) FROM stdin;
3	kidder	lukas.holubcak@gmail.com	$2b$10$nMoXzIoMELpnIreNO9/pY.v9PL7mf.UVfcBQh2YfsX7gDSrO4oHga	luk	hol	admin	2025-03-21 22:48:50.583277+01	2025-03-21 22:48:50.583277+01
1	admin	admin@pujcovna.cz	$2b$10$k7jzmqb0G8q4Xb1XaAYiAOQUUzGBNWUiY9Nfo08Zky7sK9aVMUJTW	Admin	Administrátor	admin	2025-03-18 22:22:33.330547+01	2025-04-03 22:34:57.983627+02
5	kirsch	p.kirsch@stavirezek.cz	$2b$10$n4NfxQXC0E/GD79GCJNU2.xzhEdxNOw4WABP/qwSC3F1zZGMr3QG2	Petr	Kirsch	admin	2025-04-03 22:36:31.581871+02	2025-04-03 22:36:31.581871+02
6	zakaznik	zakaznik@zakaznik.cz	$2b$10$vKOsqrnf5mKc22BM7nWIluh6zb/JCLWClnrsX1kYWdAx83pg6MWSi	zakaznik	zakaznik	user	2025-04-04 14:24:33.272582+02	2025-04-04 14:24:33.272582+02
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouses (id, name, description, is_external, supplier_id, location, contact_person, phone, email, notes, created_at, updated_at) FROM stdin;
1	Hlavní sklad	Náš hlavní interní sklad vybavení	f	\N	\N	\N	\N	\N	\N	2025-04-05 21:43:48.572177+02	2025-04-05 21:43:48.572177+02
2	Doka		t	1		pepa				2025-04-05 21:45:07.310031+02	2025-04-05 21:45:07.310031+02
\.


--
-- Name: billing_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_data_id_seq', 22, true);


--
-- Name: billing_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_items_id_seq', 116, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 3, true);


--
-- Name: delivery_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.delivery_notes_id_seq', 1, false);


--
-- Name: equipment_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_categories_id_seq', 16, true);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_id_seq', 44, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 3, true);


--
-- Name: rentals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rentals_id_seq', 44, true);


--
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.returns_id_seq', 26, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, true);


--
-- Name: user_customer_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_customer_access_id_seq', 1, true);


--
-- Name: user_order_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_order_access_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 2, true);


--
-- Name: billing_data billing_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_data
    ADD CONSTRAINT billing_data_pkey PRIMARY KEY (id);


--
-- Name: billing_items billing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_notes delivery_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_pkey PRIMARY KEY (id);


--
-- Name: equipment_categories equipment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_categories
    ADD CONSTRAINT equipment_categories_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_inventory_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_inventory_number_key UNIQUE (inventory_number);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: user_customer_access user_customer_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_customer_access
    ADD CONSTRAINT user_customer_access_pkey PRIMARY KEY (id);


--
-- Name: user_customer_access user_customer_access_user_id_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_customer_access
    ADD CONSTRAINT user_customer_access_user_id_customer_id_key UNIQUE (user_id, customer_id);


--
-- Name: user_order_access user_order_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_order_access
    ADD CONSTRAINT user_order_access_pkey PRIMARY KEY (id);


--
-- Name: user_order_access user_order_access_user_id_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_order_access
    ADD CONSTRAINT user_order_access_user_id_order_id_key UNIQUE (user_id, order_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_billing_data_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_data_order_id ON public.billing_data USING btree (order_id);


--
-- Name: idx_billing_items_billing_data_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_items_billing_data_id ON public.billing_items USING btree (billing_data_id);


--
-- Name: idx_billing_items_rental_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_items_rental_id ON public.billing_items USING btree (rental_id);


--
-- Name: idx_delivery_notes_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_notes_order_id ON public.delivery_notes USING btree (order_id);


--
-- Name: idx_equipment_is_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipment_is_external ON public.equipment USING btree (is_external);


--
-- Name: idx_equipment_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipment_supplier_id ON public.equipment USING btree (supplier_id);


--
-- Name: idx_equipment_warehouse_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipment_warehouse_id ON public.equipment USING btree (warehouse_id);


--
-- Name: idx_rentals_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_batch_id ON public.rentals USING btree (batch_id);


--
-- Name: idx_rentals_equipment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_equipment_id ON public.rentals USING btree (equipment_id);


--
-- Name: idx_rentals_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_order_id ON public.rentals USING btree (order_id);


--
-- Name: idx_returns_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_returns_batch_id ON public.returns USING btree (batch_id);


--
-- Name: idx_user_customer_access_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_customer_access_customer_id ON public.user_customer_access USING btree (customer_id);


--
-- Name: idx_user_customer_access_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_customer_access_user_id ON public.user_customer_access USING btree (user_id);


--
-- Name: idx_user_order_access_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_order_access_order_id ON public.user_order_access USING btree (order_id);


--
-- Name: idx_user_order_access_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_order_access_user_id ON public.user_order_access USING btree (user_id);


--
-- Name: billing_data update_billing_data_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_billing_data_modified BEFORE UPDATE ON public.billing_data FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: billing_items update_billing_items_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_billing_items_modified BEFORE UPDATE ON public.billing_items FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: delivery_notes update_delivery_notes_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_delivery_notes_modified BEFORE UPDATE ON public.delivery_notes FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: user_customer_access update_user_customer_access_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_customer_access_modtime BEFORE UPDATE ON public.user_customer_access FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: user_order_access update_user_order_access_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_order_access_modtime BEFORE UPDATE ON public.user_order_access FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: billing_data billing_data_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_data
    ADD CONSTRAINT billing_data_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: billing_items billing_items_billing_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_billing_data_id_fkey FOREIGN KEY (billing_data_id) REFERENCES public.billing_data(id) ON DELETE CASCADE;


--
-- Name: billing_items billing_items_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: billing_items billing_items_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: delivery_notes delivery_notes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: equipment equipment_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id);


--
-- Name: equipment equipment_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: equipment equipment_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: rentals rentals_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: rentals rentals_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: returns returns_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: user_customer_access user_customer_access_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_customer_access
    ADD CONSTRAINT user_customer_access_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: user_customer_access user_customer_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_customer_access
    ADD CONSTRAINT user_customer_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_order_access user_order_access_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_order_access
    ADD CONSTRAINT user_order_access_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: user_order_access user_order_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_order_access
    ADD CONSTRAINT user_order_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- PostgreSQL database dump complete
--

