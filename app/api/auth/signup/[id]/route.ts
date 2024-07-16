import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const formData = await req.formData();
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const image = formData.get('image') as File | null;

  let imageUrl: string | undefined;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(params.id) },
    });

    if (image) {
      const byteLength = await image.arrayBuffer();
      const bufferData = Buffer.from(byteLength);

      const timestamp = new Date().getTime();
      const fileExtension = path.extname(image.name) || '.jpg';
      const fileName = `${timestamp}${fileExtension}`;
      const imagePath = `./public/img/${fileName}`;
      imageUrl = `/img/${fileName}`;

      await writeFile(imagePath, bufferData);

      // ลบภาพเก่า
      if (existingUser?.image) {
        const oldImagePath = path.join(process.cwd(), 'public', existingUser.image);
        await unlink(oldImagePath).catch(err => console.error('Failed to delete old image:', err));
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(params.id) },
      data: {
        firstName,
        lastName,
        ...(imageUrl && { image: imageUrl }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
