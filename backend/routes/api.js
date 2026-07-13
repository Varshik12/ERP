import express from 'express';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import SalarySlip from '../models/SalarySlip.js';
import Announcement from '../models/Announcement.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import { 
  initialUsers, 
  initialDepartments, 
  initialAttendance, 
  initialLeaves, 
  initialSalarySlips, 
  initialAnnouncements 
} from '../config/db.js';

// Local in-memory mock database for offline fallback (with full structural synchronization)
let offlineUsers = [...initialUsers];
let offlineDepartments = [...initialDepartments];
let offlineAttendance = [...initialAttendance];
let offlineLeaves = [...initialLeaves];
let offlineSalarySlips = [...initialSalarySlips];
let offlineAnnouncements = [...initialAnnouncements];

const router = express.Router();

// Middleware to check if MongoDB is connected
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    req.dbOffline = true;
  }
  next();
};

router.use(checkDbConnection);

// ================= AUTHENTICATION =================

// Real Database-driven Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const emailLower = email.toLowerCase().trim();

    if (req.dbOffline) {
      let user = offlineUsers.find(u => u.email.toLowerCase() === emailLower);
      if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email. Please register.' });
      }
      if (user.password && user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid password.' });
      }
      return res.json({
        success: true,
        offline: true,
        data: user
      });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No corporate account found with this email. Please register.' });
    }

    // Verify password if stored
    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// New Registration Endpoint
router.post('/auth/register', async (req, res) => {
  const { name, email, password, role, department, designation } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  try {
    const emailLower = email.toLowerCase().trim();
    const cleanRole = 'Employee';
    const cleanDept = department || 'IT & Engineering';
    const cleanDesig = designation || 'MERN Stack Developer';

    if (req.dbOffline) {
      const exists = offlineUsers.some(u => u.email.toLowerCase() === emailLower);
      if (exists) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const newId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const newUser = {
        id: newId,
        name,
        email: emailLower,
        password,
        role: cleanRole,
        department: cleanDept,
        designation: cleanDesig,
        joiningDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        contact: '',
        address: '',
        gender: 'Male',
        dob: '1998-01-01',
        salary: cleanRole === 'Admin' ? 120000 : 50000,
        bloodGroup: 'O+',
        emergencyContact: '',
        status: 'Active',
        documents: []
      };

      offlineUsers.push(newUser);
      return res.json({ success: true, message: 'Registration successful!', data: newUser });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const newId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
    const newUser = await User.create({
      id: newId,
      name,
      email: emailLower,
      password,
      role: cleanRole,
      department: cleanDept,
      designation: cleanDesig,
      joiningDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      contact: '',
      address: '',
      gender: 'Male',
      dob: '1998-01-01',
      salary: cleanRole === 'Admin' ? 120000 : 50000,
      bloodGroup: 'O+',
      emergencyContact: '',
      status: 'Active',
      documents: []
    });

    res.json({ success: true, message: 'Registration successful!', data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= PROFILE & INDIVIDUAL USER =================

// GET User Profile (Current active user)
router.get('/user', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }
  const emailLower = email.toLowerCase().trim();
  try {
    if (req.dbOffline) {
      const u = offlineUsers.find(item => item.email.toLowerCase() === emailLower);
      if (!u) {
        return res.status(404).json({ success: false, error: 'User not found in offline database.' });
      }
      return res.json({ success: true, data: u });
    }
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT Update User Profile
router.put('/user', async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }
  try {
    const { contact, address, name, avatar, designation, department, dob, gender, bloodGroup, emergencyContact } = req.body;
    if (req.dbOffline) {
      const idx = offlineUsers.findIndex(item => item.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'User not found in offline database.' });
      }
      offlineUsers[idx] = {
        ...offlineUsers[idx],
        contact: contact !== undefined ? contact : offlineUsers[idx].contact,
        address: address !== undefined ? address : offlineUsers[idx].address,
        name: name !== undefined ? name : offlineUsers[idx].name,
        avatar: avatar !== undefined ? avatar : offlineUsers[idx].avatar,
        designation: designation !== undefined ? designation : offlineUsers[idx].designation,
        department: department !== undefined ? department : offlineUsers[idx].department,
        dob: dob !== undefined ? dob : offlineUsers[idx].dob,
        gender: gender !== undefined ? gender : offlineUsers[idx].gender,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : offlineUsers[idx].bloodGroup,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : offlineUsers[idx].emergencyContact
      };
      return res.json({ success: true, data: offlineUsers[idx] });
    }
    const updated = await User.findOneAndUpdate(
      { email },
      { $set: { contact, address, name, avatar, designation, department, dob, gender, bloodGroup, emergencyContact } },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Upload Document
router.post('/user/document', async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }
  try {
    const { name, size } = req.body;
    if (!name || !size) {
      return res.status(400).json({ success: false, error: 'Name and size are required' });
    }

    const newDoc = {
      id: `DOC-${Date.now()}`,
      name,
      size,
      uploadDate: new Date().toISOString().split('T')[0]
    };

    if (req.dbOffline) {
      const idx = offlineUsers.findIndex(item => item.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'User not found in offline database.' });
      }
      offlineUsers[idx].documents = [...(offlineUsers[idx].documents || []), newDoc];
      return res.json({ success: true, data: offlineUsers[idx], document: newDoc });
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $push: { documents: newDoc } },
      { new: true }
    );

    res.json({ success: true, data: updated, document: newDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE Document
router.delete('/user/document/:docId', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }
  try {
    const { docId } = req.params;
    if (req.dbOffline) {
      const idx = offlineUsers.findIndex(item => item.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'User not found in offline database.' });
      }
      offlineUsers[idx].documents = (offlineUsers[idx].documents || []).filter(doc => doc.id !== docId);
      return res.json({ success: true, data: offlineUsers[idx] });
    }
    const updated = await User.findOneAndUpdate(
      { email },
      { $pull: { documents: { id: docId } } },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= ADMIN: MANAGE EMPLOYEES =================

// GET all employees
router.get('/employees', async (req, res) => {
  try {
    if (req.dbOffline) {
      const emps = offlineUsers.filter(u => u.role === 'Employee');
      return res.json({ success: true, data: emps });
    }
    const employees = await User.find({ role: 'Employee' }).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create employee
router.post('/employees', async (req, res) => {
  try {
    const empData = req.body;
    if (req.dbOffline) {
      if (!empData.email || !empData.name) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }
      const existing = offlineUsers.find(u => u.email.toLowerCase() === empData.email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, error: 'Employee with this email already exists.' });
      }
      const newId = empData.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newEmp = {
        ...empData,
        id: newId,
        email: empData.email.toLowerCase(),
        role: 'Employee',
        status: 'Active',
        documents: []
      };
      offlineUsers.unshift(newEmp);

      if (empData.department) {
        const dIdx = offlineDepartments.findIndex(d => d.name === empData.department);
        if (dIdx !== -1) {
          offlineDepartments[dIdx].employeeCount = (offlineDepartments[dIdx].employeeCount || 0) + 1;
        }
      }

      return res.json({ success: true, data: newEmp });
    }

    if (!empData.email || !empData.name) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: empData.email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Employee with this email already exists.' });
    }

    const newId = empData.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmp = new User({
      ...empData,
      id: newId,
      email: empData.email.toLowerCase(),
      role: 'Employee',
      status: 'Active'
    });

    const saved = await newEmp.save();

    // Increment employeeCount in department
    if (empData.department) {
      await Department.findOneAndUpdate(
        { name: empData.department },
        { $inc: { employeeCount: 1 } }
      );
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update employee
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.dbOffline) {
      const idx = offlineUsers.findIndex(u => u.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      const oldUser = offlineUsers[idx];
      offlineUsers[idx] = {
        ...oldUser,
        ...updateData
      };

      if (oldUser.department !== updateData.department) {
        if (oldUser.department) {
          const dIdxOld = offlineDepartments.findIndex(d => d.name === oldUser.department);
          if (dIdxOld !== -1) {
            offlineDepartments[dIdxOld].employeeCount = Math.max(0, (offlineDepartments[dIdxOld].employeeCount || 0) - 1);
          }
        }
        if (updateData.department) {
          const dIdxNew = offlineDepartments.findIndex(d => d.name === updateData.department);
          if (dIdxNew !== -1) {
            offlineDepartments[dIdxNew].employeeCount = (offlineDepartments[dIdxNew].employeeCount || 0) + 1;
          }
        }
      }

      return res.json({ success: true, data: offlineUsers[idx] });
    }

    const oldUser = await User.findOne({ id });
    const updated = await User.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    // Update department counts if department changed
    if (oldUser && oldUser.department !== updateData.department) {
      if (oldUser.department) {
        await Department.findOneAndUpdate({ name: oldUser.department }, { $inc: { employeeCount: -1 } });
      }
      if (updateData.department) {
        await Department.findOneAndUpdate({ name: updateData.department }, { $inc: { employeeCount: 1 } });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE employee
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.dbOffline) {
      const idx = offlineUsers.findIndex(u => u.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      const deleted = offlineUsers[idx];
      offlineUsers.splice(idx, 1);

      if (deleted.department) {
        const dIdx = offlineDepartments.findIndex(d => d.name === deleted.department);
        if (dIdx !== -1) {
          offlineDepartments[dIdx].employeeCount = Math.max(0, (offlineDepartments[dIdx].employeeCount || 0) - 1);
        }
      }

      return res.json({ success: true, data: deleted });
    }

    const deleted = await User.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    // Decrement employeeCount in department
    if (deleted.department) {
      await Department.findOneAndUpdate(
        { name: deleted.department },
        { $inc: { employeeCount: -1 } }
      );
    }

    res.json({ success: true, data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= ADMIN: MANAGE DEPARTMENTS =================

// GET all departments
router.get('/departments', async (req, res) => {
  try {
    if (req.dbOffline) {
      // Recalculate employeeCount dynamically based on offlineUsers for highest fidelity
      offlineDepartments.forEach(dept => {
        dept.employeeCount = offlineUsers.filter(u => u.department === dept.name && u.role === 'Employee').length;
      });
      return res.json({
        success: true,
        data: offlineDepartments
      });
    }
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create department
router.post('/departments', async (req, res) => {
  try {
    const { name, manager } = req.body;
    if (req.dbOffline) {
      if (!name) {
        return res.status(400).json({ success: false, error: 'Department name is required.' });
      }
      const existing = offlineDepartments.find(d => d.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, error: 'Department already exists.' });
      }
      const newId = `DEP-${Math.floor(100 + Math.random() * 900)}`;
      const newDept = {
        id: newId,
        name,
        manager: manager || 'Not Assigned',
        employeeCount: 0
      };
      offlineDepartments.push(newDept);
      return res.json({ success: true, data: newDept });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: 'Department name is required.' });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Department already exists.' });
    }

    const newId = `DEP-${Math.floor(100 + Math.random() * 900)}`;
    const newDept = new Department({
      id: newId,
      name,
      manager: manager || 'Not Assigned',
      employeeCount: 0
    });

    const saved = await newDept.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update department
router.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manager } = req.body;

    if (req.dbOffline) {
      const idx = offlineDepartments.findIndex(d => d.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Department not found.' });
      }
      offlineDepartments[idx] = {
        ...offlineDepartments[idx],
        name: name !== undefined ? name : offlineDepartments[idx].name,
        manager: manager !== undefined ? manager : offlineDepartments[idx].manager
      };
      return res.json({ success: true, data: offlineDepartments[idx] });
    }

    const updated = await Department.findOneAndUpdate(
      { id },
      { $set: { name, manager } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE department
router.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.dbOffline) {
      const idx = offlineDepartments.findIndex(d => d.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Department not found.' });
      }
      const deleted = offlineDepartments[idx];
      offlineDepartments.splice(idx, 1);
      return res.json({ success: true, data: deleted });
    }

    const deleted = await Department.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= ATTENDANCE MODULE =================

// GET Attendance Records (With optional filters)
router.get('/attendance', async (req, res) => {
  const userId = req.query.userId || '';
  const all = req.query.all === 'true'; // Admin requests all records
  const dateFilter = req.query.date;

  try {
    if (req.dbOffline) {
      let filtered = [...offlineAttendance];
      if (!all) {
        filtered = filtered.filter(rec => rec.userId === userId);
      }
      if (dateFilter) {
        filtered = filtered.filter(rec => rec.date === dateFilter);
      }
      const recordsWithUsers = filtered.map(rec => {
        const u = offlineUsers.find(item => item.id === rec.userId);
        return {
          ...rec,
          employeeName: u ? u.name : 'Unknown Employee',
          department: u ? u.department : 'N/A'
        };
      });
      recordsWithUsers.sort((a, b) => b.date.localeCompare(a.date));
      return res.json({ success: true, data: recordsWithUsers });
    }

    let filter = {};
    if (!all) {
      filter.userId = userId;
    }
    if (dateFilter) {
      filter.date = dateFilter;
    }

    const records = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });

    // Join with User Details to get Employee Name & Dept
    const recordsWithUsers = await Promise.all(records.map(async (rec) => {
      const u = await User.findOne({ id: rec.userId });
      return {
        ...rec.toObject(),
        employeeName: u ? u.name : 'Unknown Employee',
        department: u ? u.department : 'N/A'
      };
    }));

    res.json({ success: true, data: recordsWithUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Check In (Employee)
router.post('/attendance/checkin', async (req, res) => {
  const userId = req.body.userId || '';
  try {
    const now = new Date();
    const checkInTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateStr = now.toISOString().split('T')[0];

    if (req.dbOffline) {
      const existing = offlineAttendance.find(rec => rec.userId === userId && rec.date === todayDateStr);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Already checked in for today.' });
      }

      const hour = now.getHours();
      const minutes = now.getMinutes();
      let status = 'On Time';
      if (hour > 9 || (hour === 9 && minutes > 0)) {
        status = 'Late';
      }

      const newRecord = {
        id: `ATT-${Date.now()}`,
        userId,
        date: todayDateStr,
        checkIn: checkInTimeStr,
        checkOut: null,
        status,
        hoursWorked: null
      };

      offlineAttendance.unshift(newRecord);
      return res.json({ success: true, data: newRecord });
    }

    // Check if check-in already exists for today
    const existing = await Attendance.findOne({ userId, date: todayDateStr });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already checked in for today.' });
    }

    const hour = now.getHours();
    const minutes = now.getMinutes();
    let status = 'On Time';
    if (hour > 9 || (hour === 9 && minutes > 0)) {
      status = 'Late';
    }

    const newRecord = {
      id: `ATT-${Date.now()}`,
      userId,
      date: todayDateStr,
      checkIn: checkInTimeStr,
      checkOut: null,
      status,
      hoursWorked: null
    };

    const saved = await Attendance.create(newRecord);
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Check Out (Employee)
router.post('/attendance/checkout', async (req, res) => {
  try {
    const { lastRecordId } = req.body;
    if (!lastRecordId) {
      return res.status(400).json({ success: false, error: 'lastRecordId is required' });
    }

    const now = new Date();
    const checkOutTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (req.dbOffline) {
      const idx = offlineAttendance.findIndex(rec => rec.id === lastRecordId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Attendance record not found' });
      }

      const record = offlineAttendance[idx];
      let hoursText = '9.0 hrs';
      if (record.checkIn) {
        try {
          const [timeVal, period] = record.checkIn.split(' ');
          let [inHr, inMin] = timeVal.split(':').map(Number);
          if (period === 'PM' && inHr !== 12) inHr += 12;
          if (period === 'AM' && inHr === 12) inHr = 0;

          const checkInDate = new Date();
          checkInDate.setHours(inHr, inMin, 0);

          const diffMs = now.getTime() - checkInDate.getTime();
          const diffHrs = Math.max(0.1, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
          hoursText = `${diffHrs} hrs`;
        } catch (e) {
          hoursText = '8.5 hrs';
        }
      }

      offlineAttendance[idx] = {
        ...record,
        checkOut: checkOutTimeStr,
        hoursWorked: hoursText
      };

      return res.json({ success: true, data: offlineAttendance[idx] });
    }

    const record = await Attendance.findOne({ id: lastRecordId });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    let hoursText = '9.0 hrs';
    if (record.checkIn) {
      try {
        const [timeVal, period] = record.checkIn.split(' ');
        let [inHr, inMin] = timeVal.split(':').map(Number);
        if (period === 'PM' && inHr !== 12) inHr += 12;
        if (period === 'AM' && inHr === 12) inHr = 0;

        const checkInDate = new Date();
        checkInDate.setHours(inHr, inMin, 0);

        const diffMs = now.getTime() - checkInDate.getTime();
        const diffHrs = Math.max(0.1, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
        hoursText = `${diffHrs} hrs`;
      } catch (e) {
        hoursText = '8.5 hrs';
      }
    }

    const updated = await Attendance.findOneAndUpdate(
      { id: lastRecordId },
      { $set: { checkOut: checkOutTimeStr, hoursWorked: hoursText } },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update attendance status (Admin)
router.put('/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut, hoursWorked } = req.body;

    if (req.dbOffline) {
      const idx = offlineAttendance.findIndex(rec => rec.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Attendance record not found' });
      }
      offlineAttendance[idx] = {
        ...offlineAttendance[idx],
        status: status !== undefined ? status : offlineAttendance[idx].status,
        checkIn: checkIn !== undefined ? checkIn : offlineAttendance[idx].checkIn,
        checkOut: checkOut !== undefined ? checkOut : offlineAttendance[idx].checkOut,
        hoursWorked: hoursWorked !== undefined ? hoursWorked : offlineAttendance[idx].hoursWorked
      };
      return res.json({ success: true, data: offlineAttendance[idx] });
    }

    const updated = await Attendance.findOneAndUpdate(
      { id },
      { $set: { status, checkIn, checkOut, hoursWorked } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= LEAVE MANAGEMENT =================

// GET all leaves (or filtered by user)
router.get('/leaves', async (req, res) => {
  const userId = req.query.userId || '';
  const all = req.query.all === 'true';

  try {
    if (req.dbOffline) {
      let filtered = [...offlineLeaves];
      if (!all) {
        filtered = filtered.filter(rec => rec.userId === userId);
      }
      const recordsWithUsers = filtered.map(rec => {
        const u = offlineUsers.find(item => item.id === rec.userId);
        return {
          ...rec,
          employeeName: u ? u.name : 'Unknown Employee',
          department: u ? u.department : 'N/A'
        };
      });
      recordsWithUsers.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
      return res.json({ success: true, data: recordsWithUsers });
    }

    let filter = {};
    if (!all) {
      filter.userId = userId;
    }

    const records = await Leave.find(filter).sort({ appliedDate: -1, createdAt: -1 });

    // Join with Employee detail
    const recordsWithUsers = await Promise.all(records.map(async (rec) => {
      const u = await User.findOne({ id: rec.userId });
      return {
        ...rec.toObject(),
        employeeName: u ? u.name : 'Unknown Employee',
        department: u ? u.department : 'N/A'
      };
    }));

    res.json({ success: true, data: recordsWithUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST submit leave (Employee)
router.post('/leaves', async (req, res) => {
  const userId = req.body.userId || '';
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (req.dbOffline) {
      if (!type || !startDate || !endDate || !reason) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const newRequest = {
        id: `LR-${Date.now().toString().slice(-4)}`,
        userId,
        type,
        startDate,
        endDate,
        totalDays: isNaN(totalDays) ? 1 : totalDays,
        reason,
        status: 'Pending',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      offlineLeaves.unshift(newRequest);
      return res.json({ success: true, data: newRequest });
    }

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRequest = {
      id: `LR-${Date.now().toString().slice(-4)}`,
      userId,
      type,
      startDate,
      endDate,
      totalDays: isNaN(totalDays) ? 1 : totalDays,
      reason,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    const saved = await Leave.create(newRequest);
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT Approve/Reject leave (Admin)
router.put('/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected

    if (req.dbOffline) {
      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
      }

      const idx = offlineLeaves.findIndex(rec => rec.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Leave request not found.' });
      }

      offlineLeaves[idx] = {
        ...offlineLeaves[idx],
        status
      };

      return res.json({ success: true, data: offlineLeaves[idx] });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
    }

    const updated = await Leave.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= PAYROLL / SALARY SLIPS =================

// GET Salary slips
router.get('/salaryslips', async (req, res) => {
  const userId = req.query.userId || '';
  const all = req.query.all === 'true';

  try {
    if (req.dbOffline) {
      let filtered = [...offlineSalarySlips];
      if (!all) {
        filtered = filtered.filter(slip => slip.userId === userId);
      }
      const recordsWithUsers = filtered.map(rec => {
        const u = offlineUsers.find(item => item.id === rec.userId);
        return {
          ...rec,
          employeeName: u ? u.name : 'Unknown Employee',
          designation: u ? u.designation : 'N/A',
          department: u ? u.department : 'N/A'
        };
      });
      recordsWithUsers.sort((a, b) => b.year.localeCompare(a.year) || b.month.localeCompare(a.month));
      return res.json({ success: true, data: recordsWithUsers });
    }

    let filter = {};
    if (!all) {
      filter.userId = userId;
    }

    const records = await SalarySlip.find(filter).sort({ year: -1, month: -1 });

    // Join with Employee detail
    const recordsWithUsers = await Promise.all(records.map(async (rec) => {
      const u = await User.findOne({ id: rec.userId });
      return {
        ...rec.toObject(),
        employeeName: u ? u.name : 'Unknown Employee',
        designation: u ? u.designation : 'N/A',
        department: u ? u.department : 'N/A'
      };
    }));

    res.json({ success: true, data: recordsWithUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Generate Salary (Admin)
router.post('/salaryslips/generate', async (req, res) => {
  try {
    const { userId, month, year, basic, allowances, bonus, deductions } = req.body;
    if (req.dbOffline) {
      if (!userId || !month || !year || basic === undefined) {
        return res.status(400).json({ success: false, error: 'UserId, month, year, and basic salary are required.' });
      }

      const existing = offlineSalarySlips.find(slip => slip.userId === userId && slip.month === month && slip.year === year);
      if (existing) {
        return res.status(400).json({ success: false, error: `Salary slip already exists for ${month} ${year}.` });
      }

      const netSalary = Number(basic) + Number(allowances || 0) + Number(bonus || 0) - Number(deductions || 0);

      const newSlip = {
        id: `PAY-${year}${month.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        userId,
        month,
        year,
        paymentDate: new Date().toISOString().split('T')[0],
        basic: Number(basic),
        allowances: Number(allowances || 0),
        bonus: Number(bonus || 0),
        deductions: Number(deductions || 0),
        netSalary,
        status: 'Paid'
      };

      offlineSalarySlips.unshift(newSlip);
      return res.json({ success: true, data: newSlip });
    }

    if (!userId || !month || !year || basic === undefined) {
      return res.status(400).json({ success: false, error: 'UserId, month, year, and basic salary are required.' });
    }

    // Check if salary slip already generated for employee in this month/year
    const existing = await SalarySlip.findOne({ userId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, error: `Salary slip already exists for ${month} ${year}.` });
    }

    const netSalary = Number(basic) + Number(allowances || 0) + Number(bonus || 0) - Number(deductions || 0);

    const newSlip = new SalarySlip({
      id: `PAY-${year}${month.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      month,
      year,
      paymentDate: new Date().toISOString().split('T')[0],
      basic: Number(basic),
      allowances: Number(allowances || 0),
      bonus: Number(bonus || 0),
      deductions: Number(deductions || 0),
      netSalary,
      status: 'Paid'
    });

    const saved = await newSlip.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= ANNOUNCEMENTS =================

// GET announcements
router.get('/announcements', async (req, res) => {
  try {
    if (req.dbOffline) {
      const sorted = [...offlineAnnouncements].sort((a, b) => b.date.localeCompare(a.date));
      return res.json({ success: true, data: sorted });
    }
    const records = await Announcement.find().sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create announcement (Admin)
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, category, sender } = req.body;
    if (req.dbOffline) {
      if (!title || !content || !category) {
        return res.status(400).json({ success: false, error: 'Title, content, and category are required.' });
      }

      const newAnnouncement = {
        id: `ANN-${Date.now().toString().slice(-4)}`,
        title,
        content,
        category,
        date: new Date().toISOString().split('T')[0],
        sender: sender || 'Management Desk'
      };

      offlineAnnouncements.unshift(newAnnouncement);
      return res.json({ success: true, data: newAnnouncement });
    }

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, error: 'Title, content, and category are required.' });
    }

    const newAnnouncement = new Announcement({
      id: `ANN-${Date.now().toString().slice(-4)}`,
      title,
      content,
      category,
      date: new Date().toISOString().split('T')[0],
      sender: sender || 'Management Desk'
    });

    const saved = await newAnnouncement.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================= ADMIN: MAIN DASHBOARD AGGREGATED STATS =================

router.get('/admin/dashboard-stats', async (req, res) => {
  try {
    if (req.dbOffline) {
      const totalEmployees = offlineUsers.filter(u => u.role === 'Employee').length;
      const activeEmployees = offlineUsers.filter(u => u.role === 'Employee' && u.status === 'Active').length;
      const departmentsCount = offlineDepartments.length;
      
      const todayDateStr = new Date().toISOString().split('T')[0];
      const todayAttendanceCount = offlineAttendance.filter(rec => rec.date === todayDateStr).length;
      
      const pendingLeavesCount = offlineLeaves.filter(req => req.status === 'Pending').length;

      // Sum salaries
      const monthlySalaryExpense = offlineUsers
        .filter(u => u.role === 'Employee' && u.status === 'Active')
        .reduce((sum, emp) => sum + (Number(emp.salary) || 45000), 0);

      return res.json({
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          departmentsCount,
          todayAttendanceCount,
          pendingLeavesCount,
          monthlySalaryExpense
        }
      });
    }

    const totalEmployees = await User.countDocuments({ role: 'Employee' });
    const activeEmployees = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const departmentsCount = await Department.countDocuments();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendanceCount = await Attendance.countDocuments({ date: todayStr });
    
    const pendingLeavesCount = await Leave.countDocuments({ status: 'Pending' });

    // Monthly Salary Expense (sum of all employees' salaries)
    const employees = await User.find({ role: 'Employee', status: 'Active' });
    const monthlySalaryExpense = employees.reduce((sum, emp) => sum + (emp.salary || 45000), 0);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        departmentsCount,
        todayAttendanceCount,
        pendingLeavesCount,
        monthlySalaryExpense
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


export default router;
