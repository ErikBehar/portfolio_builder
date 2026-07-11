import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { createProject, listProjects } from "@/lib/projects";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const projects = await listProjects(section);
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const project = await createProject(body);
    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}
