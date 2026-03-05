import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Activity, ShieldCheck, Users, Wrench } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { firestoreDb, isFirebaseConfigured } from '../services/firebase';

type Item = Record<string, any> & { id: string };

const formatDate = (value: any): string => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({
  icon,
  title,
  value,
}) => (
  <div className="ios-card rounded-2xl p-5">
    <div className="mb-2 flex items-center gap-2 text-brand-accent">{icon}</div>
    <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary">{title}</p>
    <p className="mt-2 text-2xl font-black text-brand-text">{value}</p>
  </div>
);

const AdminPanelPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<Item[]>([]);
  const [authEvents, setAuthEvents] = useState<Item[]>([]);
  const [usageEvents, setUsageEvents] = useState<Item[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !firestoreDb || !isAdmin) {
      return;
    }

    const unsubUsers = onSnapshot(
      query(collection(firestoreDb, 'users'), orderBy('updatedAt', 'desc'), limit(300)),
      (snap) => setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubAuthEvents = onSnapshot(
      query(collection(firestoreDb, 'authEvents'), orderBy('createdAt', 'desc'), limit(500)),
      (snap) => setAuthEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubUsageEvents = onSnapshot(
      query(collection(firestoreDb, 'usageEvents'), orderBy('createdAt', 'desc'), limit(700)),
      (snap) => setUsageEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubUsers();
      unsubAuthEvents();
      unsubUsageEvents();
    };
  }, [isAdmin]);

  const uniqueLoggedInEmails = useMemo(() => {
    const set = new Set(
      authEvents
        .filter((e) => e.eventType === 'login')
        .map((e) => String(e.email || e.targetEmail || '').toLowerCase())
        .filter(Boolean)
    );
    return set.size;
  }, [authEvents]);

  const toolUsageCount = useMemo(
    () => usageEvents.filter((e) => e.eventType === 'tool_open' || e.eventType === 'tool_action').length,
    [usageEvents]
  );

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="ios-card mx-auto max-w-3xl p-8">
        <h2 className="mb-2 text-3xl font-black text-red-400">Admin Panel Unavailable</h2>
        <p className="text-brand-text-secondary">Firebase config missing hai. Env setup complete karo.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="ios-card rounded-3xl p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-brand-accent">
          <ShieldCheck size={14} />
          Private Admin
        </p>
        <h1 className="text-4xl font-black tracking-tight text-brand-text">Admin Control Panel</h1>
        <p className="mt-2 text-brand-text-secondary">
          Logged in as <b>{user?.email}</b>. Yahan se aap dekh sakte ho kaun login kar raha hai aur website pe kya use ho raha hai.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<Users size={18} />} title="Total Users" value={users.length} />
        <StatCard icon={<ShieldCheck size={18} />} title="Login Emails" value={uniqueLoggedInEmails} />
        <StatCard icon={<Wrench size={18} />} title="Tool Events" value={toolUsageCount} />
        <StatCard icon={<Activity size={18} />} title="Usage Events" value={usageEvents.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="ios-card rounded-2xl p-5 xl:col-span-1">
          <h2 className="mb-4 text-xl font-black text-brand-text">Registered Users</h2>
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl bg-brand-primary/40 p-3">
                {(() => {
                  const completedCourses =
                    u.courseCompletions && typeof u.courseCompletions === 'object'
                      ? Object.values(u.courseCompletions).filter((item: any) => item?.completed === true).length
                      : 0;

                  return (
                    <>
                <p className="font-semibold text-brand-text">{u.email || 'unknown'}</p>
                <p className="text-xs text-brand-text-secondary">UID: {u.uid || u.id}</p>
                <p className="text-xs text-brand-text-secondary">Last Login: {formatDate(u.lastLoginAt)}</p>
                <p className="text-xs text-brand-text-secondary">Completed Courses: {completedCourses}</p>
                <p className="text-xs text-brand-text-secondary">{u.isAdmin ? 'Admin' : 'User'}</p>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </section>

        <section className="ios-card rounded-2xl p-5 xl:col-span-1">
          <h2 className="mb-4 text-xl font-black text-brand-text">Login / Signup Logs</h2>
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {authEvents.map((e) => (
              <div key={e.id} className="rounded-xl bg-brand-primary/40 p-3">
                <p className="font-semibold capitalize text-brand-text">{e.eventType}</p>
                <p className="text-sm text-brand-text-secondary">{e.email || e.targetEmail || '-'}</p>
                <p className="text-xs text-brand-text-secondary">{formatDate(e.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ios-card rounded-2xl p-5 xl:col-span-1">
          <h2 className="mb-4 text-xl font-black text-brand-text">Live Usage Logs</h2>
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {usageEvents.map((e) => (
              <div key={e.id} className="rounded-xl bg-brand-primary/40 p-3">
                <p className="font-semibold text-brand-text">{e.eventType}</p>
                <p className="text-sm text-brand-text-secondary">{e.email || '-'}</p>
                <p className="text-xs text-brand-text-secondary">
                  {e.path ? `Path: ${e.path}` : ''} {e.toolId ? `Tool: ${e.toolId}` : ''}
                </p>
                <p className="text-xs text-brand-text-secondary">{formatDate(e.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanelPage;
