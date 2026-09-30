import { DataSource } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Module } from '../../courses/entities/module.entity';
import { Lesson } from '../../courses/entities/lesson.entity';
import { User } from '../../users/entities/user.entity';
import { CourseStatus, CourseDifficulty, CourseCategory, LessonType, UserRole } from '@mindelta/shared';

export async function seedChitepoNewCourses(dataSource: DataSource) {
  const courseRepository = dataSource.getRepository(Course);
  const moduleRepository = dataSource.getRepository(Module);
  const lessonRepository = dataSource.getRepository(Lesson);
  const userRepository = dataSource.getRepository(User);

  // Find instructors
  const simbarasheMumbengegwi = await userRepository.findOne({ where: { email: 'simbarashe.mumbengegwi@chitepo.co.zw' } });
  const tafadzwaMupfumira = await userRepository.findOne({ where: { email: 'tafadzwa.mupfumira@chitepo.co.zw' } });
  const kudzaiNhema = await userRepository.findOne({ where: { email: 'kudzai.nhema@chitepo.co.zw' } });
  const rumbidzaiChikwanha = await userRepository.findOne({ where: { email: 'rumbidzai.chikwanha@chitepo.co.zw' } });
  const tendaiMoyo = await userRepository.findOne({ where: { email: 'tendai.moyo@chitepo.co.zw' } });
  const nyashaMutasa = await userRepository.findOne({ where: { email: 'nyasha.mutasa@chitepo.co.zw' } });

  if (!simbarasheMumbengegwi || !tafadzwaMupfumira || !kudzaiNhema || !rumbidzaiChikwanha || !tendaiMoyo || !nyashaMutasa) {
    console.error('[seeds] Required instructors not found. Please run user seeds first.');
    return;
  }

  // Map courses to instructors
  const courseInstructorMap: { [key: string]: User } = {
    'District Coordinating Committee (DCC) Training': kudzaiNhema,
    'Local Government Administration and Development': tafadzwaMupfumira,
    'Voter Mobilization and Campaign Management': kudzaiNhema,
    'Rural Development and Community Engagement': rumbidzaiChikwanha,
    'Party-Government Synergy and Policy Implementation': simbarasheMumbengegwi,
    'Zimbabwe\'s National Development and Vision 2030': tendaiMoyo,
    'Virtual Political Engagement and Diaspora Mobilization': nyashaMutasa,
    'Heritage Preservation and Cultural Connection': nyashaMutasa,
    'Investment and Economic Participation': nyashaMutasa,
    'Transnational Advocacy and Representation': nyashaMutasa
  };

  const newCourses = [
    // PRACTICAL GOVERNANCE TRACK (6 Courses)
    {
      title: 'District Coordinating Committee (DCC) Training',
      subtitle: 'Political mobilization, grassroots organizing, and party-government coordination',
      description: 'Comprehensive training program for District Coordinating Committee members focusing on political mobilization, grassroots organizing, party-government coordination, and achieving electoral targets including the 5 million voter population goal.',
      tags: ['DCC Training', 'Political Mobilization', 'Grassroots Organizing', 'Voter Registration', 'Party Structures', 'Local Government', 'Community Engagement', 'Electoral Strategy'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 420, // 7 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/dcc-training.jpg',
      trailerVideoUrl: '/videos/trailers/dcc-intro.mp4',
      modules: [
        {
          title: 'Political Mobilization and Organization',
          summary: 'Grassroots organizing strategies and ward-based mobilization',
          lessons: [
            { title: 'Grassroots Organizing Fundamentals', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Ward-Based Mobilization Strategies', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Cell Structure Development', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Youth and Women\'s League Coordination', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Voter Registration and Electoral Preparation', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Achieving Electoral Targets', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Party-Government Coordination',
          summary: 'Coordinating party structures with government agencies',
          lessons: [
            { title: 'Understanding District Administrative Structures', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Coordinating with Rural District Councils', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Working with Traditional Leaders', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Managing Inter-Agency Relationships', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Policy Implementation at District Level', type: LessonType.TEXT, durationSeconds: 1800 },
            { title: 'Resource Mobilization and Allocation', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Community Engagement and Development',
          summary: 'Community needs assessment and development project management',
          lessons: [
            { title: 'Community Needs Assessment', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Development Project Management', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Public-Private Partnerships', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Civil Society Engagement', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Communication and Public Relations', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Local Government Administration and Development',
      subtitle: 'Municipal management, service delivery, and urban development',
      description: 'Comprehensive training for mayors, councillors, and municipal directors on local government law, administration, service delivery, and development planning for effective local governance and community leadership.',
      tags: ['Local Government', 'Municipal Administration', 'Service Delivery', 'Urban Planning', 'Council Management', 'Devolution', 'Community Leadership'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 480, // 8 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/local-government.jpg',
      trailerVideoUrl: '/videos/trailers/local-govt-intro.mp4',
      modules: [
        {
          title: 'Local Government Law and Administration',
          summary: 'Legal frameworks and financial management',
          lessons: [
            { title: 'Urban Councils Act and RDC Act', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'By-Law Formulation and Enforcement', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Financial Management and Budgeting', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Procurement and Asset Management', type: LessonType.TEXT, durationSeconds: 1800 },
            { title: 'Service Delivery Standards', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Devolution and Local Autonomy', type: LessonType.VIDEO, durationSeconds: 1800 }
          ]
        },
        {
          title: 'Urban and Rural Development',
          summary: 'Infrastructure and economic development',
          lessons: [
            { title: 'Town Planning and Development Control', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Infrastructure Development', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Water and Sanitation Management', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Waste Management', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Housing and Land Administration', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Economic Development and Investment', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Governance and Community Leadership',
          summary: 'Democratic governance and accountability',
          lessons: [
            { title: 'Democratic Local Governance', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Stakeholder Engagement', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Transparency and Accountability', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Council Procedures and Standing Orders', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Community Participation', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Crisis Management', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Voter Mobilization and Campaign Management',
      subtitle: 'Electoral campaigns, digital organizing, and grassroots mobilization',
      description: 'Strategic training on organizing political campaigns, voter mobilization, and achieving electoral success through grassroots organizing, digital tools, and effective campaign management.',
      tags: ['Campaign Management', 'Voter Mobilization', 'Electoral Strategy', 'Digital Organizing', 'GOTV', 'Political Campaigns', 'Grassroots Mobilization'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 390, // 6.5 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/voter-mobilization.jpg',
      trailerVideoUrl: '/videos/trailers/campaign-intro.mp4',
      modules: [
        {
          title: 'Campaign Strategy and Planning',
          summary: 'Planning and executing effective campaigns',
          lessons: [
            { title: 'Electoral Systems and Context', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Campaign Planning Fundamentals', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Message Development', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Target Voter Identification', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Campaign Budget and Finance', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Grassroots Mobilization Techniques',
          summary: 'Door-to-door organizing and community events',
          lessons: [
            { title: 'Door-to-Door Canvassing', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Community Events and Rallies', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Volunteer Management', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Coalition Building', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Get-Out-The-Vote (GOTV)', type: LessonType.VIDEO, durationSeconds: 1800 }
          ]
        },
        {
          title: 'Digital Campaign Tools',
          summary: 'Social media, data analytics, and digital advertising',
          lessons: [
            { title: 'Social Media Campaigning', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'WhatsApp and Mobile Organizing', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Data and Analytics', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Digital Advertising', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Countering Misinformation', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Rural Development and Community Engagement',
      subtitle: 'Agriculture, infrastructure, and community-led development',
      description: 'Focused training on rural development strategies, agriculture, infrastructure, natural resource management, and community-led development for transforming rural areas and improving livelihoods.',
      tags: ['Rural Development', 'Agriculture', 'Infrastructure', 'Natural Resources', 'Community Engagement', 'Rural Industrialization', 'Food Security'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 420, // 7 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/rural-development.jpg',
      trailerVideoUrl: '/videos/trailers/rural-dev-intro.mp4',
      modules: [
        {
          title: 'Rural Development Strategy',
          summary: 'Agriculture, industrialization, and infrastructure',
          lessons: [
            { title: 'Agriculture and Food Security', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Rural Industrialization', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Infrastructure in Rural Areas', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Electrification and Energy', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Telecommunications and Digital Connectivity', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Rural-Urban Linkages', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Resource Management',
          summary: 'Natural resources and environmental governance',
          lessons: [
            { title: 'Natural Resource Governance', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Mining and Mineral Revenue', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Forestry and Wildlife Management', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Water Resources Management', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Land Use Planning', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Environmental Conservation', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Community Development and Services',
          summary: 'Healthcare, education, and social services',
          lessons: [
            { title: 'Primary Healthcare Delivery', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Rural Education Development', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Social Welfare Services', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Youth and Women Empowerment', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Traditional Authority Collaboration', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Cultural Heritage Preservation', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Party-Government Synergy and Policy Implementation',
      subtitle: 'Coordination between party structures and government institutions',
      description: 'Advanced training on creating effective coordination between party structures and government institutions, translating ideology into policy, and implementing national development programs at local level.',
      tags: ['Party-Government Relations', 'Policy Implementation', 'Coordination', 'National Development', 'Governance', 'Political Administration', 'Synergy Building'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 360, // 6 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/party-government-synergy.jpg',
      trailerVideoUrl: '/videos/trailers/synergy-intro.mp4',
      modules: [
        {
          title: 'Understanding Party-Government Relations',
          summary: 'Constitutional framework and coordination mechanisms',
          lessons: [
            { title: 'Constitutional Framework', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Party Supremacy and Government Accountability', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Coordination Mechanisms', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Managing Tensions and Conflicts', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'International Models and Lessons', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Policy Development and Implementation',
          summary: 'From ideology to policy formulation',
          lessons: [
            { title: 'From Ideology to Policy', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Policy Formulation Process', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Implementation Planning', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Resource Mobilization for Policy', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Monitoring and Evaluation', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Building Synergies',
          summary: 'Communication, planning, and accountability',
          lessons: [
            { title: 'Communication and Information Sharing', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Joint Planning Mechanisms', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Accountability Frameworks', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Capacity Building Programs', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Success Stories and Best Practices', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Zimbabwe\'s National Development and Vision 2030',
      subtitle: 'National development framework and sectoral strategies',
      description: 'Comprehensive course on Zimbabwe\'s national development framework, Vision 2030 goals, sectoral strategies, and implementation mechanisms for achieving upper middle-income status by 2030.',
      tags: ['Vision 2030', 'National Development', 'Economic Growth', 'Infrastructure', 'Agriculture', 'Mining', 'Manufacturing', 'Zimbabwe Economy'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 450, // 7.5 hours
      price: 0,
      category: CourseCategory.PRACTICAL_GOVERNANCE,
      coverImageUrl: '/images/courses/vision-2030.jpg',
      trailerVideoUrl: '/videos/trailers/vision-2030-intro.mp4',
      modules: [
        {
          title: 'Vision 2030 Framework',
          summary: 'Background, pillars, and financing',
          lessons: [
            { title: 'Background and Context', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Core Pillars of Vision 2030', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Targets and Milestones', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Financing Vision 2030', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Implementation Architecture', type: LessonType.VIDEO, durationSeconds: 1800 }
          ]
        },
        {
          title: 'Sectoral Development Strategies',
          summary: 'Key economic sectors and growth areas',
          lessons: [
            { title: 'Agriculture and Food Systems', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Mining and Minerals Beneficiation', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Manufacturing and Industry', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Infrastructure Development', type: LessonType.TEXT, durationSeconds: 1800 },
            { title: 'Tourism and Hospitality', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Human Capital Development', type: LessonType.VIDEO, durationSeconds: 1800 }
          ]
        },
        {
          title: 'Localization and Implementation',
          summary: 'Provincial and district-level action',
          lessons: [
            { title: 'Provincial Development Plans', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'District and Ward-Level Action', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Private Sector Engagement', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Monitoring Progress', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Success Stories and Learning', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    // DIASPORA ENGAGEMENT PROGRAM (4 Courses)
    {
      title: 'Virtual Political Engagement and Diaspora Mobilization',
      subtitle: 'Political participation and organizing from abroad',
      description: 'Comprehensive online training for diaspora members on political participation, digital organizing, voter mobilization from abroad, and maintaining ideological connection with homeland.',
      tags: ['Diaspora', 'Political Mobilization', 'Digital Organizing', 'Virtual Engagement', 'Voter Registration', 'Diaspora Leadership', 'Online Activism'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 480, // 8 hours
      price: 0,
      category: CourseCategory.DIASPORA_PROGRAM,
      coverImageUrl: '/images/courses/diaspora-political.jpg',
      trailerVideoUrl: '/videos/trailers/diaspora-political-intro.mp4',
      modules: [
        {
          title: 'Ideological Foundation and National Identity',
          summary: 'Liberation heritage and maintaining Zimbabwean identity',
          lessons: [
            { title: 'Liberation Heritage', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Political Ideology Fundamentals', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Maintaining Zimbabwean Identity Abroad', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Contemporary Political Context', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Diaspora Role in Nation Building', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Electoral Rights and Participation', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Digital Activism and Mobilization',
          summary: 'Social media organizing and virtual campaigns',
          lessons: [
            { title: 'Social Media Organizing', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Digital Security and Privacy', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Countering Fake News', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Virtual Event Organization', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Fundraising Online', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Community Organization',
          summary: 'Building diaspora structures and leadership',
          lessons: [
            { title: 'Building Diaspora Structures', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Community Leadership', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Cultural Events and Celebrations', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Youth and Second-Generation Engagement', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Host Country Relations', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Heritage Preservation and Cultural Connection',
      subtitle: 'Maintaining culture, language, and identity abroad',
      description: 'Training on preserving Zimbabwean culture, language, and heritage while living abroad, helping diaspora members maintain cultural identity and teach children about their heritage.',
      tags: ['Heritage Preservation', 'Cultural Identity', 'Language Teaching', 'Traditional Culture', 'Diaspora Youth', 'Cultural Events', 'Zimbabwean Culture'],
      difficulty: CourseDifficulty.BEGINNER,
      estimatedDuration: 360, // 6 hours
      price: 0,
      category: CourseCategory.DIASPORA_PROGRAM,
      coverImageUrl: '/images/courses/heritage-preservation.jpg',
      trailerVideoUrl: '/videos/trailers/heritage-intro.mp4',
      modules: [
        {
          title: 'Cultural Identity and Heritage',
          summary: 'Language, traditions, and historical knowledge',
          lessons: [
            { title: 'Language Preservation', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Traditional Practices and Ceremonies', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Music, Dance, and Arts', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Food and Culinary Heritage', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Historical Knowledge', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Cultural Programming',
          summary: 'Events, schools, and content creation',
          lessons: [
            { title: 'Event Planning and Organization', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Saturday Schools and Youth Programs', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Content Creation', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Festivals and Celebrations', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Partnerships and Collaboration', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Maintaining Homeland Connections',
          summary: 'Family ties, tourism, and virtual connectivity',
          lessons: [
            { title: 'Family and Community Ties', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Virtual Connectivity', type: LessonType.VIDEO, durationSeconds: 1200 },
            { title: 'Tourism and Visits', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Supporting Communities Back Home', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Documenting Diaspora Stories', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        }
      ]
    },
    {
      title: 'Investment and Economic Participation',
      subtitle: 'Business opportunities and economic contribution',
      description: 'Comprehensive training on investment opportunities in Zimbabwe, business establishment, remittances management, and economic contribution to national development from diaspora.',
      tags: ['Diaspora Investment', 'Business Opportunities', 'Zimbabwe Economy', 'Remittances', 'Entrepreneurship', 'Economic Development', 'Investment Strategy'],
      difficulty: CourseDifficulty.ADVANCED,
      estimatedDuration: 600, // 10 hours
      price: 0,
      category: CourseCategory.DIASPORA_PROGRAM,
      coverImageUrl: '/images/courses/diaspora-investment.jpg',
      trailerVideoUrl: '/videos/trailers/investment-intro.mp4',
      modules: [
        {
          title: 'Understanding Zimbabwe\'s Economy',
          summary: 'Economic landscape and policy framework',
          lessons: [
            { title: 'Economic History and Context', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Current Economic Landscape', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Vision 2030 Opportunities', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Investment Policy Framework', type: LessonType.TEXT, durationSeconds: 1800 },
            { title: 'Financial Systems and Currency', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Tax and Incentives', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Investment Opportunities',
          summary: 'Sector-specific opportunities and vehicles',
          lessons: [
            { title: 'Agriculture and Agro-Processing', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Mining and Minerals', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Real Estate Investment', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Manufacturing Opportunities', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Tourism and Hospitality', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Technology and Innovation', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Healthcare and Education', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Investment Vehicles and Options', type: LessonType.VIDEO, durationSeconds: 1500 }
          ]
        },
        {
          title: 'Practical Implementation',
          summary: 'Starting businesses and managing remotely',
          lessons: [
            { title: 'Starting a Business', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Company Registration', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Financing and Partnerships', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Remote Management', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Remittances Best Practices', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Risk Management', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Success Stories', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    },
    {
      title: 'Transnational Advocacy and Representation',
      subtitle: 'Advocacy for Zimbabwe in host countries',
      description: 'Training on advocacy for Zimbabwe in host countries, engaging with foreign governments and media, coalition building, and representing Zimbabwe\'s interests abroad.',
      tags: ['Advocacy', 'Transnational Politics', 'Diaspora Diplomacy', 'Public Relations', 'Campaign Management', 'International Relations', 'Media Engagement'],
      difficulty: CourseDifficulty.INTERMEDIATE,
      estimatedDuration: 360, // 6 hours
      price: 0,
      category: CourseCategory.DIASPORA_PROGRAM,
      coverImageUrl: '/images/courses/diaspora-advocacy.jpg',
      trailerVideoUrl: '/videos/trailers/advocacy-intro.mp4',
      modules: [
        {
          title: 'Advocacy Fundamentals',
          summary: 'Understanding advocacy and international context',
          lessons: [
            { title: 'Understanding Advocacy', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Zimbabwe\'s International Image', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Foreign Policy Context', type: LessonType.TEXT, durationSeconds: 1500 },
            { title: 'Sanctions and Their Impact', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Building Positive Narratives', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Practical Advocacy Skills',
          summary: 'Engaging governments, media, and partners',
          lessons: [
            { title: 'Engaging Host Governments', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Media Relations', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Coalition Building', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Public Speaking and Presentations', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Writing for Impact', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        },
        {
          title: 'Campaign Management',
          summary: 'Planning and executing advocacy campaigns',
          lessons: [
            { title: 'Planning Advocacy Campaigns', type: LessonType.VIDEO, durationSeconds: 1800 },
            { title: 'Mobilizing Supporters', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Digital Advocacy Tools', type: LessonType.VIDEO, durationSeconds: 1500 },
            { title: 'Measuring Impact', type: LessonType.TEXT, durationSeconds: 1200 },
            { title: 'Legal and Ethical Considerations', type: LessonType.VIDEO, durationSeconds: 1200 }
          ]
        }
      ]
    }
  ];

  console.log('Starting to seed 10 new Chitepo courses...');

  for (const courseData of newCourses) {
    // Check if course already exists
    const existingCourse = await courseRepository.findOne({
      where: { title: courseData.title }
    });

    if (existingCourse) {
      console.log(`Course "${courseData.title}" already exists, skipping...`);
      continue;
    }

    // Get the correct instructor for this course
    const courseInstructor = courseInstructorMap[courseData.title] || simbarasheMumbengegwi;

    // Create course
    const course = courseRepository.create({
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      tags: courseData.tags,
      difficulty: courseData.difficulty,
      category: courseData.category as CourseCategory,
      estimatedDuration: courseData.estimatedDuration,
      price: courseData.price,
      coverImageUrl: courseData.coverImageUrl,
      trailerVideoUrl: courseData.trailerVideoUrl,
      instructorId: courseInstructor.id,
      status: CourseStatus.PUBLISHED,
      averageRating: Math.random() * 1.5 + 3.5,
      totalRatings: Math.floor(Math.random() * 150) + 30,
      totalEnrollments: Math.floor(Math.random() * 400) + 80,
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

  console.log('✅ New Chitepo courses seeding completed!');
  console.log(`   Total new courses created: ${newCourses.length}`);
  console.log('   Categories:');
  console.log('   - Practical Governance Track (6 courses)');
  console.log('   - Diaspora Engagement Program (4 courses)');
}

