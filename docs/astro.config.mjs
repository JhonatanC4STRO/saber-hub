// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'SaberHub Docs',
			description: 'Documentación oficial de SaberHub — plataforma LMS moderna construida con Next.js, Prisma y PostgreSQL.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Español', lang: 'es' },
			},
			logo: {
				light: './src/assets/houston.webp',
				dark: './src/assets/houston.webp',
				replacesTitle: false,
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/tu-org/lms-saberHub' },
			],
			sidebar: [
				{
					label: '00 — Overview',
					items: [
						{ label: 'Descripción General', slug: '00-overview/readme' },
						{ label: 'Visión del Proyecto', slug: '00-overview/vision' },
						{ label: 'Glosario', slug: '00-overview/glossary' },
						{ label: 'Guía de Inicio', slug: '00-overview/guia-inicio' },
					],
				},
				{
					label: '01 — Producto',
					items: [{ autogenerate: { directory: '01-product' } }],
				},
				{
					label: '02 — Arquitectura',
					items: [{ autogenerate: { directory: '02-architecture' } }],
				},
				{
					label: '03 — Base de Datos',
					items: [{ autogenerate: { directory: '03-database' } }],
				},
				{
					label: '04 — API',
					items: [{ autogenerate: { directory: '04-api' } }],
				},
				{
					label: '05 — Frontend',
					items: [{ autogenerate: { directory: '05-frontend' } }],
				},
				{
					label: '06 — Scraping',
					items: [{ autogenerate: { directory: '06-scraping' } }],
				},
				{
					label: '07 — Seguridad',
					items: [
						{ label: 'Autenticación', slug: '07-security/autenticacion' },
					],
				},
				{
					label: '08 — Deployment',
					items: [{ autogenerate: { directory: '08-deployment' } }],
				},
				{
					label: '09 — Development',
					items: [{ autogenerate: { directory: '09-development' } }],
				},
				{
					label: '10 — Legal',
					items: [{ autogenerate: { directory: '10-legal' } }],
				},
			],
			customCss: [],
		}),
	],
});
