import argon2 from 'argon2';
import { User, StudentProfile, Course, Batch, Semester, Subject, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Provision Test Student & Initial Sample Curriculum (BCA 2024-2027)
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures that the database has a working BCA 2024-2027 batch, odd/even semesters,
 * subjects, and a ready-to-test student account:
 * - Enrollment Number: 00115502024
 * - Password: Student@12345!
 * - Email: student@jcc.edu.in
 */
export const provisionTestStudentAndCurriculum = async () => {
  return await sequelize.transaction(async (t) => {
    // 1. Ensure BCA Course
    let course = await Course.findOne({ where: { code: 'BCA' }, transaction: t });
    if (!course) {
      course = await Course.create(
        {
          code: 'BCA',
          name: 'Bachelor of Computer Applications',
          shortName: 'BCA',
          duration: 3,
          totalSemesters: 6,
          isActive: true,
        },
        { transaction: t }
      );
    }

    // 2. Ensure Batch 2024-2027
    let batch = await Batch.findOne({
      where: { courseId: course.id, name: '2024-2027' },
      transaction: t,
    });
    if (!batch) {
      batch = await Batch.create(
        {
          courseId: course.id,
          name: '2024-2027',
          startYear: 2024,
          endYear: 2027,
          isActive: true,
        },
        { transaction: t }
      );
    }

    // 3. Ensure Semesters (1 to 6)
    const semesterMap = {};
    for (let semNum = 1; semNum <= 6; semNum++) {
      let sem = await Semester.findOne({
        where: { courseId: course.id, batchId: batch.id, number: semNum },
        transaction: t,
      });
      if (!sem) {
        sem = await Semester.create(
          {
            courseId: course.id,
            batchId: batch.id,
            number: semNum,
            name: `Semester ${semNum}`,
            isActive: true,
          },
          { transaction: t }
        );
      }
      semesterMap[semNum] = sem;
    }

    // 4. Ensure Sample Subjects for each semester
    const sampleCurriculum = [
      // Sem 1 (Odd)
      { sem: 1, code: 'BCA-101', name: 'Discrete Mathematics', credits: 4 },
      { sem: 1, code: 'BCA-103', name: 'Introduction to Programming in C', credits: 4 },
      { sem: 1, code: 'BCA-105', name: 'Principles of Management', credits: 3 },
      { sem: 1, code: 'BCA-151', name: 'Practical - C Programming Lab', credits: 2 },
      // Sem 2 (Even)
      { sem: 2, code: 'BCA-102', name: 'Data Structures using C', credits: 4 },
      { sem: 2, code: 'BCA-104', name: 'Database Management Systems', credits: 4 },
      // Sem 3 (Odd)
      { sem: 3, code: 'BCA-201', name: 'Object Oriented Programming in Java', credits: 4 },
      { sem: 3, code: 'BCA-203', name: 'Computer Networks', credits: 4 },
      { sem: 3, code: 'BCA-205', name: 'Web Technologies (HTML, CSS, JS)', credits: 4 },
      { sem: 3, code: 'BCA-251', name: 'Practical - Java Programming Lab', credits: 2 },
      // Sem 4 (Even)
      { sem: 4, code: 'BCA-202', name: 'Operating Systems', credits: 4 },
      { sem: 4, code: 'BCA-204', name: 'Software Engineering', credits: 4 },
      // Sem 5 (Odd)
      { sem: 5, code: 'BCA-301', name: 'Python Programming & Data Science', credits: 4 },
      { sem: 5, code: 'BCA-303', name: 'Information Security & Cyber Law', credits: 4 },
      { sem: 5, code: 'BCA-305', name: 'Cloud Computing & DevOps', credits: 3 },
      // Sem 6 (Even)
      { sem: 6, code: 'BCA-302', name: 'Artificial Intelligence & Machine Learning', credits: 4 },
      { sem: 6, code: 'BCA-352', name: 'Major Project / Dissertation', credits: 8 },
    ];

    for (const sub of sampleCurriculum) {
      const sem = semesterMap[sub.sem];
      const existingSub = await Subject.findOne({
        where: { code: sub.code, courseId: course.id, semesterId: sem.id },
        transaction: t,
      });
      if (!existingSub) {
        await Subject.create(
          {
            courseId: course.id,
            batchId: batch.id,
            semesterId: sem.id,
            code: sub.code,
            name: sub.name,
            credits: sub.credits,
            isActive: true,
          },
          { transaction: t }
        );
      }
    }

    // 5. Ensure Test Student Account
    const testEnrollment = '00115502024';
    const testEmail = 'student@jcc.edu.in';
    const rawPass = 'Student@12345!';

    let studentProfile = await StudentProfile.findOne({
      where: { enrollmentNumber: testEnrollment },
      include: [{ model: User, as: 'user' }],
      transaction: t,
    });

    if (!studentProfile) {
      const hashedPassword = await argon2.hash(rawPass);
      const user = await User.create(
        {
          fullName: 'Rahul Sharma',
          email: testEmail,
          password: hashedPassword,
          role: 'student',
          isActive: true,
          isEmailVerified: true,
        },
        { transaction: t }
      );

      studentProfile = await StudentProfile.create(
        {
          userId: user.id,
          enrollmentNumber: testEnrollment,
          mobile: '9876543210',
          courseId: course.id,
          batchId: batch.id,
          currentSemester: 3,
          fatherName: 'Mr. Suresh Sharma',
          motherName: 'Mrs. Anita Sharma',
          dateOfBirth: '2004-08-15',
          address: 'JCC Rohini Sector 3 Campus Hostel, New Delhi - 110085',
        },
        { transaction: t }
      );

      logger.info({ enrollmentNumber: testEnrollment }, 'Test student account provisioned');
    }

    return {
      success: true,
      student: {
        fullName: 'Rahul Sharma',
        enrollmentNumber: testEnrollment,
        email: testEmail,
        password: rawPass,
        course: 'BCA (Bachelor of Computer Applications)',
        batch: '2024-2027',
        currentSemester: 3,
      },
    };
  });
};
