require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateInstructors() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'mindelta'
  });

  try {
    console.log('Connected to database');

    // Get instructor IDs
    const [instructors] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE role = "instructor"'
    );

    console.log('Found instructors:', instructors.map(i => `${i.first_name} ${i.last_name} (${i.email})`));

    const instructorMap = {};
    instructors.forEach(i => {
      instructorMap[i.email] = i.id;
    });

    // Course to instructor mapping
    const courseMapping = {
      'District Coordinating Committee (DCC) Training': 'kudzai.nhema@chitepo.edu.zw',
      'Local Government Administration and Development': 'tafadzwa.mupfumira@chitepo.edu.zw',
      'Voter Mobilization and Campaign Management': 'kudzai.nhema@chitepo.edu.zw',
      'Rural Development and Community Engagement': 'rumbidzai.chikwanha@chitepo.edu.zw',
      'Party-Government Synergy and Policy Implementation': 'simbarashe.mumbengegwi@chitepo.edu.zw',
      "Zimbabwe's National Development and Vision 2030": 'tendai.moyo@chitepo.edu.zw',
      'Virtual Political Engagement and Diaspora Mobilization': 'nyasha.mutasa@chitepo.edu.zw',
      'Heritage Preservation and Cultural Connection': 'nyasha.mutasa@chitepo.edu.zw',
      'Investment and Economic Participation': 'nyasha.mutasa@chitepo.edu.zw',
      'Transnational Advocacy and Representation': 'nyasha.mutasa@chitepo.edu.zw'
    };

    let updated = 0;
    for (const [courseTitle, instructorEmail] of Object.entries(courseMapping)) {
      const instructorId = instructorMap[instructorEmail];
      if (instructorId) {
        await connection.execute(
          'UPDATE courses SET instructor_id = ? WHERE title = ?',
          [instructorId, courseTitle]
        );
        console.log(`✅ Updated: ${courseTitle} -> ${instructorEmail}`);
        updated++;
      } else {
        console.log(`⚠️  Instructor not found: ${instructorEmail}`);
      }
    }

    // Update all other courses to use default instructor
    const defaultInstructorId = instructorMap['simbarashe.mumbengegwi@chitepo.edu.zw'];
    if (defaultInstructorId) {
      const [result] = await connection.execute(
        `UPDATE courses SET instructor_id = ? 
         WHERE title NOT IN (${Object.keys(courseMapping).map(() => '?').join(',')})`,
        [defaultInstructorId, ...Object.keys(courseMapping)]
      );
      console.log(`✅ Updated ${result.affectedRows} other courses to default instructor`);
      updated += result.affectedRows;
    }

    console.log(`\n✅ Total courses updated: ${updated}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

updateInstructors();
