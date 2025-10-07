import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { auth } from '@/auth'
import { Project } from '@/lib/types'

// GET all projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.email || 'anonymous'

    const projectsRef = db.collection('projects')
    const snapshot = await projectsRef
      .where('userId', '==', userId)
      .get()

    const projects: Project[] = snapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Project
      })
      .sort((a, b) => {
        // 客戶端排序：最新的在前
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to save projects.' },
        { status: 403 }
      )
    }

    const userId = session.user.email

    const body = await request.json()
    const {
      name,
      description,
      requirement,
      initialPRD,
      refinedPRD,
      finalPRD,
      pages,
      questions,
      answers,
      techStack,
      mode,
    } = body

    const now = new Date()

    const projectData = {
      name,
      description: description || '',
      requirement,
      initialPRD: initialPRD || '',
      refinedPRD: refinedPRD || '',
      finalPRD: finalPRD || '',
      pages: pages || [],
      questions: questions || [],
      answers: answers || {},
      techStack: techStack || null,
      mode: mode || 'normal',
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection('projects').add(projectData)

    return NextResponse.json({
      id: docRef.id,
      ...projectData,
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
