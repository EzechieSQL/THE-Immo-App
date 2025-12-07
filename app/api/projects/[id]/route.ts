import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const body = await req.json();
    const { userId } = body;
    const projectId = params.id;

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const supabaseServer = createSupabaseServerClient();
    // verify ownership
    const { data: proj, error: fetchErr } = await supabaseServer
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (fetchErr || !proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (proj.owner_id !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { error } = await supabaseServer.from('projects').delete().eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const body = await req.json();
    const { userId, updates } = body;
    const projectId = params.id;

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    if (!updates) return NextResponse.json({ error: 'updates required' }, { status: 400 });

    const supabaseServer = createSupabaseServerClient();
    // Only allow update if owner matches
    const { data: proj, error: fetchErr } = await supabaseServer
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (fetchErr || !proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (proj.owner_id !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { error } = await supabaseServer.from('projects').update(updates).eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
