  const addTeacher = (data: Omit<Teacher, 'id' | 'status' | 'joinedDate'>) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newTeacher: Teacher = {
      ...data,
      id: `tech-${Date.now()}-${randSuffix}`,
      status: 'نشط',
      joinedDate: new Date().toISOString().split('T')[0],
      rating: 5.0,
    };
    setTeachers((prev) => [newTeacher, ...prev]);

    addAuditLog({
      action: `إضافة مدرسة جديدة: ${newTeacher.name}`,
      actionType: 'create',
      targetCategory: 'teachers',
      targetId: newTeacher.id,
      targetName: newTeacher.name,
      details: `تمت إضافة المدرسة لتدريس مادة (${newTeacher.subject}) للصفوف (${(newTeacher.assignedGrades || []).join('، ')})`,
      severity: 'success',
    });

    // Push notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${randSuffix}`,
      title: lang === 'ar' ? 'انضمام مدرسة جديدة للهيئة التدريسية' : 'New Faculty Member Added',
      message: `${newTeacher.name} - ${newTeacher.subject}`,
      type: 'info',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const addStudent = (data: Omit<Student, 'id' | 'status' | 'enrollmentYear'> & { enrollmentYear?: string }) => {
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const newStudent: Student = {
      ...data,
      id: `std-${Date.now()}-${randSuffix}`,
      status: 'منتظمة',
      enrollmentYear: data.enrollmentYear?.trim() || '2026',
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Auto add parent account link
    const newParent: Parent = {
      id: `prt-${Date.now()}-${randSuffix}`,
      name: data.parentName,
      phone: data.parentPhone,
      email: data.parentEmail,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
    };
    setParents((prev) => [newParent, ...prev]);

    // Create initial tuition financial record
    const fin: FinancialRecord = {
      id: `fin-${Date.now()}-${randSuffix}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      gradeLevel: newStudent.gradeLevel,
      feeType: 'رسوم التسجيل والكتب',
      totalAmount: 120000,
      paidAmount: 0,
      status: 'غير مدفوع',
      dueDate: '2026-09-01',
    };
    setFinancial((prev) => [fin, ...prev]);

    addAuditLog({
      action: `تسجيل طالبة جديدة: ${newStudent.name}`,
      actionType: 'create',
      targetCategory: 'students',
      targetId: newStudent.id,
      targetName: newStudent.name,
      details: `تسجيل الطالبة في ${newStudent.gradeLevel} - شعبة (${newStudent.section}) مع ربط حساب ولي الأمر (${data.parentName})`,
      severity: 'success',
    });

    // Push notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${randSuffix}`,
      title: lang === 'ar' ? 'تسجيل طالبة جديدة بالمدرسة' : 'New Gifted Student Registered',
      message: `${newStudent.name} (${newStudent.gradeLevel})`,
      type: 'success',
      timestamp: lang === 'ar' ? 'الآن' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // User Management Implementations
  const updateTeacher = (id: string, updated: Partial<Teacher>) => {
    let teacherName = '';
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          teacherName = t.name;
          return { ...t, ...updated };
        }
        return t;
      })
    );

    addAuditLog({
      action: `تعديل بيانات المدرسة: ${teacherName || id}`,
      actionType: 'update',
      targetCategory: 'teachers',
      targetId: id,
      targetName: teacherName || id,
      details: `تم تحديث السجل والبيانات للمدرسة (${teacherName})`,
      severity: 'info',
    });
  };

  const deleteTeacher = (id: string) => {
    let deletedName = '';
    setTeachers((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) deletedName = target.name;
      return prev.filter((t) => t.id !== id);
    });

