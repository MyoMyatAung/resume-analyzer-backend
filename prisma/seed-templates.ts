import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('Seeding resume templates...');

  const templates = [
    {
      templateKey: 'ats-simple',
      name: 'ATS Simple',
      description:
        'Maximally ATS-compatible template with minimal formatting. Single-column layout with standard fonts ensures your resume passes through applicant tracking systems with ease. Perfect for corporate applications and traditional industries.',
      category: 'minimal',
      previewUrl: '/templates/ats-simple-preview.svg',
      order: 1,
      features: [
        'ATS-Optimized',
        'Single Column',
        'Standard Fonts',
        'Clean Layout',
        'High Compatibility',
        'No Graphics',
      ],
      isActive: true,
    },
    {
      templateKey: 'professional',
      name: 'Professional',
      description:
        'Traditional corporate design with clean typography and professional aesthetics. Features serif fonts for headers and a navy blue accent color. Ideal for business, finance, consulting, and traditional industries.',
      category: 'traditional',
      previewUrl: '/templates/professional-preview.svg',
      order: 2,
      features: [
        'Corporate Design',
        'Serif Fonts',
        'Professional Look',
        'Two-Column Skills',
        'ATS-Friendly',
        'Navy Accents',
      ],
      isActive: true,
    },
    {
      templateKey: 'modern',
      name: 'Modern',
      description:
        'Contemporary design with accent colors and modern typography. Features clean lines, strategic use of color, and excellent visual hierarchy. Great for tech, startups, creative roles, and forward-thinking companies.',
      category: 'contemporary',
      previewUrl: '/templates/modern-preview.svg',
      order: 3,
      features: [
        'Modern Design',
        'Accent Colors',
        'Clean Layout',
        'Visual Appeal',
        'Tech-Friendly',
        'ATS-Compatible',
      ],
      isActive: true,
    },
  ];

  for (const template of templates) {
    await prisma.resumeTemplate.upsert({
      where: { templateKey: template.templateKey },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        previewUrl: template.previewUrl,
        order: template.order,
        features: template.features,
        isActive: template.isActive,
      },
      create: template,
    });
    console.log(`  - Upserted template: ${template.name}`);
  }

  console.log('Resume templates seeded successfully!');
}

seedTemplates()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
