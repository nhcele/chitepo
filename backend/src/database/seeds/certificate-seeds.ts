import { DataSource } from 'typeorm';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { Enrollment } from '../../courses/entities/enrollment.entity';
import { Course } from '../../courses/entities/course.entity';

export async function seedCertificates(dataSource: DataSource) {
  console.log('[seeds] Seeding certificates...');
  
  const certificateRepository = dataSource.getRepository(Certificate);
  const enrollmentRepository = dataSource.getRepository(Enrollment);
  const courseRepository = dataSource.getRepository(Course);
  
  // Clear existing certificates
  await certificateRepository.clear();
  
  // Get completed enrollments
  const completedEnrollments = await enrollmentRepository.find({
    where: { progressPercentage: 100 },
  });
  
  if (completedEnrollments.length === 0) {
    console.log('[seeds] No completed enrollments found, skipping certificate seeding');
    return [];
  }

  const certificates = [];
  
  for (const enrollment of completedEnrollments) {
    const course = await courseRepository.findOne({ 
      where: { id: enrollment.courseId } 
    });
    
    if (!course) continue;

    certificates.push({
      id: `certificate-${certificates.length + 1}`,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      certificateUrl: `/certificates/${enrollment.userId}/${enrollment.courseId}.pdf`,
      blockchainTxHash: null, // Will be set when blockchain is configured
      ipfsHash: null, // Will be set when IPFS is configured
      issuedAt: enrollment.completedAt || new Date(),
      verifiedAt: new Date(),
    });
  }

  const createdCertificates = await certificateRepository.save(certificates);
  console.log(`[seeds] Created ${createdCertificates.length} certificates`);
  
  return createdCertificates;
}
