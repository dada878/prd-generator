import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { auth } from '@/auth'

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view projects.' },
        { status: 403 }
      )
    }

    const userId = session.user.email
    const { id } = await params

    const docRef = db.collection('projects').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const data = doc.data()

    // Check if user owns this project
    if (data?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update projects.' },
        { status: 403 }
      )
    }

    const userId = session.user.email
    const { id } = await params

    const docRef = db.collection('projects').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const data = doc.data()

    // Check if user owns this project
    if (data?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()

    await docRef.update({
      ...body,
      updatedAt: new Date(),
    })

    const updatedDoc = await docRef.get()
    const updatedData = updatedDoc.data()

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate(),
      updatedAt: updatedData?.updatedAt?.toDate(),
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to delete projects.' },
        { status: 403 }
      )
    }

    const userId = session.user.email
    const { id } = await params

    const docRef = db.collection('projects').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const data = doc.data()

    // Check if user owns this project
    if (data?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
