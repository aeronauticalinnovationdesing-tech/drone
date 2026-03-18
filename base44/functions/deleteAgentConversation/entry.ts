import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, agent_name } = await req.json();

    if (!conversation_id || !agent_name) {
      return Response.json({ error: 'Missing conversation_id or agent_name' }, { status: 400 });
    }

    // Marcar como eliminado usando updateConversation
    await base44.agents.updateConversation(conversation_id, {
      metadata: {
        is_deleted: true,
        deleted_at: new Date().toISOString()
      }
    });

    return Response.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});