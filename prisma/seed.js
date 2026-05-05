const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 创建一个测试模板以验证种子功能
  const template = await prisma.template.upsert({
    where: { slug: 'test-template' },
    update: {},
    create: {
      name: '测试模板',
      slug: 'test-template',
      description: '测试模板',
      category: 'general',
      structure: {
        title: '测试报告',
        sections: [
          { id: 'section1', title: '第一节', content: '' }
        ]
      },
      prompts: {
        research: '测试',
        analysis: '测试',
        writing: '测试'
      },
      isPublic: true
    }
  });

  console.log('模板创建成功:', template.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });