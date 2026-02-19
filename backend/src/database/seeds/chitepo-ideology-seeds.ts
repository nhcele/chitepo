import { DataSource } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Module } from '../../courses/entities/module.entity';
import { Lesson } from '../../courses/entities/lesson.entity';
import { User } from '../../users/entities/user.entity';
import { CourseStatus, CourseDifficulty, LessonType, UserRole } from '@mindelta/shared';

export async function seedChitepoIdeologyCourses(dataSource: DataSource) {
  const courseRepository = dataSource.getRepository(Course);
  const moduleRepository = dataSource.getRepository(Module);
  const lessonRepository = dataSource.getRepository(Lesson);
  const userRepository = dataSource.getRepository(User);

  // Find or create ideology instructor
  let instructor = await userRepository.findOne({ where: { email: 'ideology.instructor@chitepo.edu' } });
  if (!instructor) {
    instructor = userRepository.create({
      email: 'ideology.instructor@chitepo.edu',
      firstName: 'Herbert',
      lastName: 'Chitepo',
      password: '$2b$10$YSX3oc7lG8e7kGOJv5lS1.wCc8xkZ1pHzLK8YBxQPvW8O/kZJ3rHC', // password: password123
      role: UserRole.INSTRUCTOR,
    });
    instructor = await userRepository.save(instructor);
  }

  const chitepoCourses = [
    {
      title: 'Pan-Africanism and African Unity',
      subtitle: 'Foundations of African solidarity and continental integration',
      description: 'Explore the history, philosophy, and contemporary relevance of Pan-Africanism. This comprehensive course examines the movement for African unity, key historical figures, the role of the African Union, and strategies for economic and political integration across the continent.',
      tags: ['Pan-Africanism', 'African Unity', 'Continental Integration', 'African History', 'Solidarity'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 420, // 7 hours
      price: 0,
      coverImageUrl: '/images/courses/pan-africanism.jpg',
      trailerVideoUrl: '/videos/trailers/pan-africanism-intro.mp4',
      modules: [
        {
          title: 'Historical Foundations of Pan-Africanism',
          summary: 'Origins and evolution of Pan-African thought',
          lessons: [
            { title: 'Early Pan-African Movements', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Key Figures: Nkrumah, Nyerere, and Cabral', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'The Manchester Conference 1945', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Pan-Africanism in the Diaspora', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Liberation Struggles and Independence',
          summary: 'African liberation movements and decolonization',
          lessons: [
            { title: 'The Decolonization Process', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Armed Liberation Struggles', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Non-Aligned Movement', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Support Networks Across Africa', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Contemporary Pan-Africanism',
          summary: 'Modern institutions and integration efforts',
          lessons: [
            { title: 'From OAU to African Union', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Agenda 2063: The Africa We Want', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Regional Economic Communities', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Challenges to African Unity', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Revolutionary Theory and Practice',
      subtitle: 'Principles of revolutionary transformation and social change',
      description: 'Comprehensive study of revolutionary theory from classical texts to contemporary applications. Learn about revolutionary strategy, organization building, mass mobilization, and the transformation of society through collective action and political consciousness.',
      tags: ['Revolution', 'Social Change', 'Political Theory', 'Mass Mobilization', 'Transformation'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 480, // 8 hours
      price: 0,
      coverImageUrl: '/images/courses/revolutionary-theory.jpg',
      trailerVideoUrl: '/videos/trailers/revolution-intro.mp4',
      modules: [
        {
          title: 'Foundations of Revolutionary Thought',
          summary: 'Classical revolutionary theory and philosophy',
          lessons: [
            { title: 'Marx and Historical Materialism', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Lenin on Organization and Strategy', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Gramsci: Hegemony and Culture', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Fanon and Decolonization', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Revolutionary Strategy and Tactics',
          summary: 'Practical approaches to revolutionary change',
          lessons: [
            { title: 'Mass Line and Popular Support', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Building Revolutionary Organizations', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'United Front Tactics', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Armed Struggle vs Political Struggle', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Propaganda and Political Education', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Post-Revolutionary Governance',
          summary: 'Consolidating and defending revolutionary gains',
          lessons: [
            { title: 'State Power and Transformation', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Economic Reconstruction', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Cultural Revolution and Consciousness', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'International Solidarity', type: LessonType.VIDEO, durationSeconds: 900 }
          ]
        }
      ]
    },
    {
      title: 'Political Economy and Development',
      subtitle: 'Economic systems, development strategies, and wealth creation',
      description: 'In-depth examination of political economy with focus on African development challenges and opportunities. Study various economic systems, development theories, resource management, industrialization strategies, and sustainable economic transformation in the African context.',
      tags: ['Political Economy', 'Development', 'Economic Policy', 'Industrialization', 'Wealth Creation'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 450, // 7.5 hours
      price: 0,
      coverImageUrl: '/images/courses/political-economy.jpg',
      trailerVideoUrl: '/videos/trailers/economy-intro.mp4',
      modules: [
        {
          title: 'Economic Systems and Ideologies',
          summary: 'Comparative analysis of economic systems',
          lessons: [
            { title: 'Capitalism: Theory and Practice', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Socialism and Planned Economies', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'African Socialism and Ujamaa', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Mixed Economies and State Intervention', type: LessonType.TEXT, durationSeconds: 900 }
          ]
        },
        {
          title: 'Development Theories and Strategies',
          summary: 'Approaches to economic development',
          lessons: [
            { title: 'Modernization vs Dependency Theory', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Import Substitution Industrialization', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Export-Led Growth Models', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Endogenous Development', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Sustainable Development Goals', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Resource Management and Industrialization',
          summary: 'Strategic use of resources for development',
          lessons: [
            { title: 'Natural Resource Governance', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Value Addition and Beneficiation', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Agricultural Transformation', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Technology Transfer and Innovation', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Regional Economic Integration', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Leadership and Governance',
      subtitle: 'Principles of effective leadership and democratic governance',
      description: 'Comprehensive training in leadership theory and practice with emphasis on public service, democratic governance, accountability, and nation-building. Learn the skills needed to lead effectively in government, political organizations, and civil society.',
      tags: ['Leadership', 'Governance', 'Public Service', 'Democracy', 'Accountability'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      coverImageUrl: '/images/courses/leadership-governance.jpg',
      trailerVideoUrl: '/videos/trailers/leadership-intro.mp4',
      modules: [
        {
          title: 'Leadership Principles and Styles',
          summary: 'Foundations of effective leadership',
          lessons: [
            { title: 'Leadership Theory and Models', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Servant Leadership', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Transformational Leadership', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Collective vs Individual Leadership', type: LessonType.VIDEO, durationSeconds: 900 }
          ]
        },
        {
          title: 'Democratic Governance',
          summary: 'Principles and practice of democratic systems',
          lessons: [
            { title: 'Democracy and Participation', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Separation of Powers', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Rule of Law and Constitutionalism', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Electoral Systems and Processes', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Decentralization and Local Government', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Accountability and Ethics',
          summary: 'Building transparent and accountable institutions',
          lessons: [
            { title: 'Public Service Ethics', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Anti-Corruption Strategies', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Transparency and Open Government', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Oversight and Accountability Mechanisms', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        }
      ]
    },
    {
      title: 'African History and Liberation Heritage',
      subtitle: 'Pre-colonial civilization to independence struggles',
      description: 'Comprehensive examination of African history from ancient civilizations through colonialism to liberation struggles and independence. Understand the rich heritage of African peoples, the impact of colonialism, and the heroic struggles for freedom and self-determination.',
      tags: ['African History', 'Liberation', 'Colonialism', 'Independence', 'Heritage'],
      difficulty: CourseDifficulty.BEGINNER,
      estimatedDuration: 480, // 8 hours
      price: 0,
      coverImageUrl: '/images/courses/african-history.jpg',
      trailerVideoUrl: '/videos/trailers/history-intro.mp4',
      modules: [
        {
          title: 'Pre-Colonial African Civilizations',
          summary: 'Ancient and medieval African societies',
          lessons: [
            { title: 'Great Zimbabwe and Mapungubwe', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'West African Empires: Ghana, Mali, Songhai', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Ancient Egypt and Nubia', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'East African City-States', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Political and Economic Systems', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Colonialism and Resistance',
          summary: 'European colonization and African resistance',
          lessons: [
            { title: 'The Scramble for Africa', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Colonial Administration Systems', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Economic Exploitation', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Early Resistance Movements', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Impact of World Wars', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Liberation Struggles',
          summary: 'Armed and political struggles for independence',
          lessons: [
            { title: 'Zimbabwe Liberation War', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Mozambique and Angola', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Kenya: Mau Mau Uprising', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Algeria and North Africa', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Role of Frontline States', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'End of Apartheid in South Africa', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Social Transformation and Nation Building',
      subtitle: 'Creating inclusive and prosperous societies',
      description: 'Study the processes of social transformation and nation-building in post-independence Africa. Examine strategies for creating national unity, addressing inequality, promoting social justice, and building cohesive national identities while respecting diversity.',
      tags: ['Nation Building', 'Social Justice', 'National Unity', 'Transformation', 'Social Policy'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 330, // 5.5 hours
      price: 0,
      coverImageUrl: '/images/courses/nation-building.jpg',
      trailerVideoUrl: '/videos/trailers/nation-building-intro.mp4',
      modules: [
        {
          title: 'National Identity and Unity',
          summary: 'Building cohesive national consciousness',
          lessons: [
            { title: 'Forging National Identity', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Managing Ethnic Diversity', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Language Policy and Education', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'National Symbols and Narratives', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Social Justice and Equity',
          summary: 'Addressing inequality and promoting fairness',
          lessons: [
            { title: 'Land Reform and Redistribution', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Economic Empowerment Programs', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Gender Equality and Women\'s Rights', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Youth Development', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Social Safety Nets', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Cultural and Educational Transformation',
          summary: 'Reshaping culture and education systems',
          lessons: [
            { title: 'Decolonizing Education', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Cultural Renaissance', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Indigenous Knowledge Systems', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Media and National Consciousness', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'International Relations and Diplomacy',
      subtitle: 'Foreign policy, diplomacy, and global engagement',
      description: 'Comprehensive study of international relations with focus on African perspectives and interests. Learn about diplomacy, multilateral institutions, South-South cooperation, and how African states navigate the complex global political and economic system.',
      tags: ['International Relations', 'Diplomacy', 'Foreign Policy', 'Global Politics', 'Multilateralism'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 390, // 6.5 hours
      price: 0,
      coverImageUrl: '/images/courses/international-relations.jpg',
      trailerVideoUrl: '/videos/trailers/diplomacy-intro.mp4',
      modules: [
        {
          title: 'Foundations of International Relations',
          summary: 'Theory and practice of global politics',
          lessons: [
            { title: 'Realism, Liberalism, and Constructivism', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'State Sovereignty and Intervention', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Power and Hegemony', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Neo-colonialism and Imperialism', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'African Foreign Policy',
          summary: 'Principles and practice of African diplomacy',
          lessons: [
            { title: 'Non-Alignment and Autonomy', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'South-South Cooperation', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Africa in the United Nations', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Regional Integration Diplomacy', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'China-Africa Relations', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Global Challenges and African Responses',
          summary: 'Addressing contemporary international issues',
          lessons: [
            { title: 'Climate Change and Environmental Diplomacy', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'International Trade and Economic Justice', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Peace and Security Architecture', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Migration and Diaspora Engagement', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Political Philosophy and Ideology',
      subtitle: 'Major political theories and ideological frameworks',
      description: 'Systematic study of political philosophy from classical to contemporary thought. Examine major ideological systems including socialism, liberalism, nationalism, and African political thought. Develop critical thinking about politics, power, and social organization.',
      tags: ['Political Philosophy', 'Ideology', 'Political Theory', 'Critical Thinking', 'Social Theory'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 450, // 7.5 hours
      price: 0,
      coverImageUrl: '/images/courses/political-philosophy.jpg',
      trailerVideoUrl: '/videos/trailers/philosophy-intro.mp4',
      modules: [
        {
          title: 'Classical Political Philosophy',
          summary: 'Ancient and Enlightenment political thought',
          lessons: [
            { title: 'Plato and Aristotle on the State', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Social Contract Theory: Hobbes, Locke, Rousseau', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Enlightenment and Democracy', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Hegel: History and Freedom', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Modern Political Ideologies',
          summary: 'Major ideological systems',
          lessons: [
            { title: 'Liberalism and Individual Rights', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Socialism and Collective Ownership', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Conservatism and Tradition', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Nationalism and Self-Determination', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Anarchism and Anti-Statism', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'African Political Thought',
          summary: 'Indigenous and contemporary African philosophy',
          lessons: [
            { title: 'Ubuntu and Communal Ethics', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Negritude and Black Consciousness', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'African Socialism: Nyerere and Senghor', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Post-Colonial Political Theory', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Contemporary African Philosophers', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Contemporary African Politics and Democracy',
      subtitle: 'Democratic governance and political systems in modern Africa',
      description: 'Examine the evolution of democratic governance in Africa, analyzing electoral systems, party politics, civil society, and the challenges of building sustainable democratic institutions. This course explores case studies from across the continent and debates on African democracy.',
      tags: ['Democracy', 'African Politics', 'Elections', 'Civil Society', 'Governance'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 390, // 6.5 hours
      price: 0,
      coverImageUrl: '/images/courses/african-democracy.jpg',
      trailerVideoUrl: '/videos/trailers/democracy-intro.mp4',
      modules: [
        {
          title: 'Democratic Transitions in Africa',
          summary: 'The evolution from independence to multiparty democracy',
          lessons: [
            { title: 'Waves of Democratization', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Constitutional Reforms', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Electoral Systems in Africa', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Case Studies: Ghana, South Africa, Botswana', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Political Parties and Competition',
          summary: 'Party systems and electoral politics',
          lessons: [
            { title: 'Party Formation and Ideology', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Dominant Party Systems', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Opposition Politics', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Campaign Finance and Resources', type: LessonType.VIDEO, durationSeconds: 900 }
          ]
        },
        {
          title: 'Challenges to Democracy',
          summary: 'Contemporary threats and opportunities',
          lessons: [
            { title: 'Authoritarianism and Democratic Backsliding', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Ethnic Politics and National Cohesion', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Corruption and Accountability', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Youth and Digital Democracy', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Gender Studies and Feminism in Africa',
      subtitle: 'Women\'s rights, gender equality, and feminist movements',
      description: 'Comprehensive exploration of gender issues in Africa, from historical women\'s movements to contemporary feminist theory and practice. Learn about women\'s economic empowerment, political participation, and struggles against patriarchy in African contexts.',
      tags: ['Gender', 'Feminism', 'Women\'s Rights', 'Equality', 'Social Justice'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      coverImageUrl: '/images/courses/gender-feminism.jpg',
      trailerVideoUrl: '/videos/trailers/feminism-intro.mp4',
      modules: [
        {
          title: 'African Feminism and Women\'s Movements',
          summary: 'History and philosophy of African feminism',
          lessons: [
            { title: 'Pre-Colonial Women\'s Power', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Colonial Impact on Gender Relations', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'African Feminist Thought', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Women in Liberation Struggles', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Gender and Political Participation',
          summary: 'Women in governance and leadership',
          lessons: [
            { title: 'Quota Systems and Representation', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Women Presidents and Prime Ministers', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Grassroots Women\'s Organizations', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Intersectionality in African Politics', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Economic Empowerment and Rights',
          summary: 'Gender justice in economics and law',
          lessons: [
            { title: 'Land Rights and Property Ownership', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Women Entrepreneurs and Markets', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Legal Frameworks for Gender Equality', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Violence Against Women', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Environmental Justice and Climate Policy',
      subtitle: 'Climate change, environmental rights, and sustainable development',
      description: 'Explore the intersection of environmental issues and social justice in Africa. Study climate change impacts, resource management, environmental policy, and the fight for environmental justice in communities across the continent.',
      tags: ['Environment', 'Climate Justice', 'Sustainability', 'Resource Management', 'Policy'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      coverImageUrl: '/images/courses/climate-justice.jpg',
      trailerVideoUrl: '/videos/trailers/climate-intro.mp4',
      modules: [
        {
          title: 'Climate Change in Africa',
          summary: 'Understanding impacts and vulnerabilities',
          lessons: [
            { title: 'Climate Science and African Contexts', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Drought, Floods, and Extreme Weather', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Agricultural and Food Security Impacts', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Migration and Climate Refugees', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Resource Extraction and Justice',
          summary: 'Environmental conflicts and resource rights',
          lessons: [
            { title: 'Mining, Oil, and Communities', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Land Grabs and Displacement', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Water Rights and Access', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Indigenous Knowledge and Conservation', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Green Policy and Activism',
          summary: 'Environmental movements and policy solutions',
          lessons: [
            { title: 'African Climate Activists', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Renewable Energy Transitions', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'International Climate Negotiations', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Green Jobs and Just Transition', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        }
      ]
    },
    {
      title: 'Youth Leadership and Empowerment',
      subtitle: 'Developing the next generation of African leaders',
      description: 'Empower young Africans with leadership skills, political engagement strategies, and tools for social change. This course covers youth movements, entrepreneurship, civic participation, and building a new generation of leaders for Africa.',
      tags: ['Youth', 'Leadership', 'Empowerment', 'Activism', 'Innovation'],
      difficulty: CourseDifficulty.BEGINNER,
      estimatedDuration: 300, // 5 hours
      price: 0,
      coverImageUrl: '/images/courses/youth-leadership.jpg',
      trailerVideoUrl: '/videos/trailers/youth-intro.mp4',
      modules: [
        {
          title: 'Youth and Political Participation',
          summary: 'Engaging in politics and governance',
          lessons: [
            { title: 'Youth Demographics and Power', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Student Movements in Africa', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Voting and Electoral Participation', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Running for Office as a Young Person', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Leadership Skills and Development',
          summary: 'Building effective leadership capacity',
          lessons: [
            { title: 'Communication and Public Speaking', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Team Building and Collaboration', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Strategic Thinking and Planning', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Ethical Leadership', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Youth Entrepreneurship and Innovation',
          summary: 'Economic empowerment through enterprise',
          lessons: [
            { title: 'Startup Ecosystems in Africa', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Social Entrepreneurship', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Technology and Innovation', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Youth Unemployment Solutions', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Pan-African Media and Communication',
      subtitle: 'Media, journalism, and communication for African development',
      description: 'Explore the role of media in African politics, development, and cultural expression. Study journalism ethics, digital media, propaganda, and the power of communication in shaping African narratives and fostering Pan-African solidarity.',
      tags: ['Media', 'Journalism', 'Communication', 'Digital Media', 'Narrative'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 330, // 5.5 hours
      price: 0,
      coverImageUrl: '/images/courses/pan-african-media.jpg',
      trailerVideoUrl: '/videos/trailers/media-intro.mp4',
      modules: [
        {
          title: 'Media and African Politics',
          summary: 'The political economy of African media',
          lessons: [
            { title: 'Colonial Media and Information Control', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Press Freedom and Censorship', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'State Media vs Independent Media', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Investigative Journalism in Africa', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Digital Media and Social Networks',
          summary: 'New technologies and African voices',
          lessons: [
            { title: 'Social Media Activism', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Fake News and Misinformation', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Digital Platforms and Connectivity', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Afrofuturism and Digital Culture', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Cultural Production and Representation',
          summary: 'Storytelling and African narratives',
          lessons: [
            { title: 'African Cinema and Film', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Music as Political Expression', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Literature and Pan-Africanism', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Challenging Western Media Narratives', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        }
      ]
    },
    {
      title: 'African Languages and Cultural Studies',
      subtitle: 'Linguistic diversity and cultural preservation',
      description: 'Celebrate and study Africa\'s linguistic and cultural wealth. Explore language policy, indigenous knowledge systems, cultural heritage, and the role of African languages in education, politics, and cultural identity.',
      tags: ['Languages', 'Culture', 'Heritage', 'Identity', 'Preservation'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      coverImageUrl: '/images/courses/african-languages.jpg',
      trailerVideoUrl: '/videos/trailers/languages-intro.mp4',
      modules: [
        {
          title: 'African Linguistic Diversity',
          summary: 'Language families and distribution',
          lessons: [
            { title: 'Major African Language Families', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Swahili as a Pan-African Language', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Endangered Languages', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Multilingualism in Africa', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Language Policy and Politics',
          summary: 'Language in education and governance',
          lessons: [
            { title: 'Colonial Languages and Power', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Mother Tongue Education', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Language Rights and Recognition', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Official Languages and Nation Building', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Cultural Heritage and Knowledge',
          summary: 'Indigenous knowledge and cultural practices',
          lessons: [
            { title: 'Oral Traditions and Storytelling', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Traditional Medicine and Science', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'Cultural Festivals and Rituals', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Preserving Cultural Heritage', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Security Studies and Conflict Resolution',
      subtitle: 'Peace, security, and conflict transformation in Africa',
      description: 'Comprehensive analysis of security challenges and conflict resolution in Africa. Study armed conflicts, peacekeeping, transitional justice, and strategies for building lasting peace and security across the continent.',
      tags: ['Security', 'Conflict', 'Peace', 'Resolution', 'Peacekeeping'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 420, // 7 hours
      price: 0,
      coverImageUrl: '/images/courses/security-studies.jpg',
      trailerVideoUrl: '/videos/trailers/security-intro.mp4',
      modules: [
        {
          title: 'Conflicts in Contemporary Africa',
          summary: 'Understanding causes and dynamics of conflict',
          lessons: [
            { title: 'Types of Conflict in Africa', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Resource Conflicts and Violence', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Ethnic and Religious Tensions', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Terrorism and Extremism', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'External Interventions', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Peacekeeping and Mediation',
          summary: 'Mechanisms for conflict prevention and resolution',
          lessons: [
            { title: 'African Union Peace and Security', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Regional Peacekeeping Forces', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Mediation and Negotiation', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Disarmament and Demobilization', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Transitional Justice and Reconciliation',
          summary: 'Building peace after conflict',
          lessons: [
            { title: 'Truth Commissions', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'International Criminal Justice', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Traditional Justice Mechanisms', type: LessonType.TEXT, durationSeconds: 1080 },
            { title: 'Post-Conflict Reconstruction', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Human Rights and Social Movements',
      subtitle: 'Rights advocacy and grassroots organizing for change',
      description: 'Study the struggle for human rights in Africa and the power of social movements. Explore civil and political rights, economic and social rights, and learn strategies for organizing, advocacy, and movement building.',
      tags: ['Human Rights', 'Social Movements', 'Activism', 'Advocacy', 'Justice'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      coverImageUrl: '/images/courses/human-rights.jpg',
      trailerVideoUrl: '/videos/trailers/rights-intro.mp4',
      modules: [
        {
          title: 'Human Rights in Africa',
          summary: 'Framework and evolution of rights',
          lessons: [
            { title: 'Universal vs African Human Rights', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'The African Charter on Human Rights', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Civil and Political Rights', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Economic, Social, and Cultural Rights', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Social Movements and Protests',
          summary: 'Grassroots organizing and mobilization',
          lessons: [
            { title: 'Labor Movements and Unions', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Student and Youth Movements', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Protest Tactics and Strategies', type: LessonType.TEXT, durationSeconds: 720 },
            { title: 'Digital Organizing and #Hashtag Activism', type: LessonType.VIDEO, durationSeconds: 1080 }
          ]
        },
        {
          title: 'Advocacy and Legal Strategies',
          summary: 'Using law and policy for social change',
          lessons: [
            { title: 'Public Interest Litigation', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Civil Society Organizations', type: LessonType.VIDEO, durationSeconds: 1080 },
            { title: 'International Human Rights Mechanisms', type: LessonType.TEXT, durationSeconds: 900 },
            { title: 'Protecting Activists and Defenders', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    }
  ];

  console.log('Starting to seed Chitepo School of Ideology courses...');

  for (const courseData of chitepoCourses) {
    // Check if course already exists
    const existingCourse = await courseRepository.findOne({
      where: { title: courseData.title }
    });

    if (existingCourse) {
      console.log(`Course "${courseData.title}" already exists, skipping...`);
      continue;
    }

    // Create course
    const course = courseRepository.create({
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      tags: courseData.tags,
      difficulty: courseData.difficulty,
      estimatedDuration: courseData.estimatedDuration,
      price: courseData.price,
      coverImageUrl: courseData.coverImageUrl,
      trailerVideoUrl: courseData.trailerVideoUrl,
      instructorId: instructor.id,
      status: CourseStatus.PUBLISHED,
      averageRating: Math.random() * 1.5 + 3.5, // Random rating between 3.5 and 5.0
      totalRatings: Math.floor(Math.random() * 150) + 30, // Random ratings count
      totalEnrollments: Math.floor(Math.random() * 400) + 80, // Random enrollments
    });

    const savedCourse = await courseRepository.save(course);
    console.log(`Created course: ${savedCourse.title}`);

    // Create modules and lessons
    for (let moduleIndex = 0; moduleIndex < courseData.modules.length; moduleIndex++) {
      const moduleData = courseData.modules[moduleIndex];
      
      const module = moduleRepository.create({
        courseId: savedCourse.id,
        title: moduleData.title,
        summary: moduleData.summary,
        orderIndex: moduleIndex + 1,
      });

      const savedModule = await moduleRepository.save(module);
      console.log(`  Created module: ${savedModule.title}`);

      // Create lessons
      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
        const lessonData = moduleData.lessons[lessonIndex];
        
        const lesson = lessonRepository.create({
          moduleId: savedModule.id,
          title: lessonData.title,
          videoDuration: lessonData.durationSeconds,
          orderIndex: lessonIndex + 1,
          isPublished: true,
          videoUrl: lessonData.type === LessonType.VIDEO ? `/videos/lessons/${savedCourse.id}/${savedModule.id}/${lessonIndex + 1}.mp4` : undefined,
          content: lessonData.type === LessonType.TEXT ? `Content for ${lessonData.title}` : undefined,
        });

        await lessonRepository.save(lesson);
        console.log(`    Created lesson: ${lesson.title}`);
      }
    }
  }

  console.log('✅ Chitepo School of Ideology courses seeding completed!');
  console.log(`   Total courses created: ${chitepoCourses.length}`);
  console.log('   Topics covered:');
  console.log('   - Pan-Africanism and African Unity');
  console.log('   - Revolutionary Theory and Practice');
  console.log('   - Political Economy and Development');
  console.log('   - Leadership and Governance');
  console.log('   - African History and Liberation Heritage');
  console.log('   - Social Transformation and Nation Building');
  console.log('   - International Relations and Diplomacy');
  console.log('   - Political Philosophy and Ideology');
  console.log('   - Contemporary African Politics and Democracy');
  console.log('   - Gender Studies and Feminism in Africa');
  console.log('   - Environmental Justice and Climate Policy');
  console.log('   - Youth Leadership and Empowerment');
  console.log('   - Pan-African Media and Communication');
  console.log('   - African Languages and Cultural Studies');
  console.log('   - Security Studies and Conflict Resolution');
  console.log('   - Human Rights and Social Movements');
}

