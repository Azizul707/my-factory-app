import dbConnect from '@/lib/db';
import Section from '@/models/Section';
import { NextResponse } from 'next/server';

// আগের ডিফল্ট সেকশন ও পাসওয়ার্ড লিস্ট (যাতে পুরনো লগিন কাজ করে)
const DEFAULT_SECTIONS = [
  { name: 'নরমাল', user: 'normal@employee', pass: 'Nrm$24!Fast#X' },
  { name: 'স্পেশাল', user: 'special@employee', pass: 'Spc#L99!Pow$Z' },
  { name: 'বেকারি', user: 'bakery@employee', pass: 'Bkr@Hot!Cak$7' },
  { name: 'ড্রাই', user: 'dry@employee', pass: 'Dry#Kk!Sto$5' },
  { name: 'মেরুল', user: 'merul@employee', pass: 'Mrl@Ct!Safe#2' },
  { name: 'মধ্যবাড্ডা', user: 'badda@employee', pass: 'Mdb#99!Road$Q' },
  { name: 'রামপুরা', user: 'rampura@employee', pass: 'Rmp@Tv!Zone#8' },
  { name: 'টিভি সেন্টার', user: 'tvcenter@employee', pass: 'Tvc#Bt!New$1' },
  { name: 'নতুন বিসমিল্লাহ', user: 'newbis@employee', pass: 'Nbs@77!Foo$D' },
  { name: 'শাহজাদপুর', user: 'shahjad@employee', pass: 'Shj#Gp!Tow$3' },
  { name: 'রসমেলা', user: 'roshmela@employee', pass: 'Rsm@Sw!Yum$6' }
];

export async function GET() {
  await dbConnect();
  let sections = await Section.find().sort({ createdAt: 1 });

  // প্রথমবার রান করার সময় ডিফল্ট ডাটা ও পাসওয়ার্ড ঢুকিয়ে দেবে
  if (sections.length === 0) {
    await Section.insertMany(DEFAULT_SECTIONS.map(s => ({ 
        name: s.name, 
        username: s.user, 
        password: s.pass 
    })));
    sections = await Section.find().sort({ createdAt: 1 });
  }

  return NextResponse.json(sections);
}

export async function POST(req) {
  await dbConnect();
  const { name, username, password } = await req.json();
  
  try {
    const newSection = await Section.create({ name, username, password });
    return NextResponse.json(newSection);
  } catch (error) {
    return NextResponse.json({ error: "Username or Section name already exists" }, { status: 400 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  const { id } = await req.json();
  await Section.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
