import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("MY_SUPER_SECRET_KEY_RAJBHOG_2025");

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload; 
  } catch (e) { return null; }
}

export async function GET(req) {
  await dbConnect();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedSection = searchParams.get('section');
  let query = { isArchived: false };

  // লজিক: যদি এডমিন হয়, এবং কোনো সেকশন চায়, তবে সেটা দিবে। আর না চাইলে সব দিবে।
  if (user.role !== 'ADMIN') {
      query.section = user.section;
  } else {
      if (requestedSection) query.section = requestedSection;
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 });
  return NextResponse.json(employees);
}

// ... বাকি সব মেথড (POST, PUT) আগের মতোই থাকবে ...
// (POST এবং PUT মেথডগুলো অপরিবর্তিত রাখুন, কারণ ওগুলো ঠিক আছে)

export async function POST(req) {
  await dbConnect();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const newEmployee = await Employee.create(body);
  return NextResponse.json(newEmployee);
}

export async function PUT(req) {
  await dbConnect();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, action, payload } = body; 

  const employee = await Employee.findById(id);
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'MARK_ABSENT') employee.absentDates.push(new Date());
  if (action === 'START_LEAVE') { employee.status = 'OnLeave'; employee.leaveStartDate = new Date(); }
  if (action === 'END_LEAVE') {
    const start = new Date(employee.leaveStartDate);
    const end = new Date(); 
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) { employee.absentDates.push(new Date(d)); }
    employee.status = 'Active'; employee.leaveStartDate = null;
  }
  if (action === 'ADD_ADVANCE') employee.advances.push({ amount: Number(payload.amount), date: new Date() });
  if (action === 'PAY_SALARY') employee.paymentHistory.push(payload);
  if (action === 'TERMINATE') { employee.status = 'Terminated'; employee.isArchived = true; }

  await employee.save();
  return NextResponse.json(employee);
}