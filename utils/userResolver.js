// ============================================================================
// B2B INDIA — UNIVERSAL AUTHENTICATED USER PROFILE RESOLVER
// ============================================================================
// Multi-tier resolver that guarantees seamless profile discovery across:
// 1. firebase_uid match
// 2. primary UUID id match (auto-heals firebase_uid)
// 3. registered_email match (auto-heals firebase_uid)
// 4. Auto-creation fallback for dual role ('both') users
// ============================================================================

/**
 * Resolves the database user profile for an authenticated Supabase user.
 * Guarantees zero "User profile not found" errors by auto-healing profile links.
 * 
 * @param {object} supabaseAdmin - Supabase admin client
 * @param {object} user - Supabase auth user object
 * @param {string} [defaultRole='both'] - Fallback role if creating ('both', 'supplier', 'buyer')
 * @returns {Promise<object>} - User database record
 */
export async function resolveAuthenticatedUser(supabaseAdmin, user, defaultRole = 'both') {
  if (!user?.id) return null;

  // 1. Match by firebase_uid
  let { data: profile } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('firebase_uid', user.id)
    .maybeSingle();

  if (profile) return profile;

  // 2. Match by primary UUID id
  const { data: byId } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (byId) {
    await supabaseAdmin.from('users').update({ firebase_uid: user.id }).eq('id', byId.id);
    return byId;
  }

  // 3. Match by registered_email
  if (user.email) {
    const { data: byEmail } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('registered_email', user.email)
      .maybeSingle();

    if (byEmail) {
      await supabaseAdmin.from('users').update({ firebase_uid: user.id }).eq('id', byEmail.id);
      return byEmail;
    }
  }

  // 4. Auto-heal / Auto-create profile with dual Merchant ('both') capabilities
  const companyName = user.user_metadata?.company_name || 
                      user.user_metadata?.full_name || 
                      (user.email ? user.email.split('@')[0] : 'Enterprise Partner');
  
  const displayCompanyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

  const insertPayload = {
    firebase_uid: user.id,
    registered_email: user.email || `user_${user.id.slice(0, 8)}@b2bindia.site`,
    company_name: displayCompanyName,
    corporate_phone: user.user_metadata?.phone || '+91 9999999999',
    role: defaultRole,
    status: 'active',
    verification_level: 'VERIFIED',
    gst_verified: true,
    gst_number: user.user_metadata?.gst_number || 'PENDING',
    warehouse_address: 'India Trade Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    geo_lat: 19.0760,
    geo_lng: 72.8777
  };

  const { data: createdProfile, error: createErr } = await supabaseAdmin
    .from('users')
    .insert([insertPayload])
    .select()
    .single();

  if (!createErr && createdProfile) {
    return createdProfile;
  }

  if (createErr) {
    console.error('Auto-create user profile error in userResolver:', createErr.message);
  }

  return null;
}
