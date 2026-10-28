'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  KeyRound,
  Mail,
  User,
  Trash2,
  Pencil,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  created_at: string;
}

interface ProfileItem {
  code: string;
  label: string;
  badge: string;
  description: string;
  permissions: string[];
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'users' | 'create' | 'profiles';
}

export default function AdminUsersModal({
  isOpen,
  onClose,
  initialTab = 'users',
}: AdminUsersModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'create' | 'profiles'>(initialTab);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // État formulaire Création
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState('USER');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // État formulaire Édition
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // État Suppression
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // État Nouveau Profil
  const [newProfileCode, setNewProfileCode] = useState('');
  const [newProfileLabel, setNewProfileLabel] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchUsersAndProfiles();
    }
  }, [isOpen, initialTab]);

  const fetchUsersAndProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setProfiles(data.profiles || []);
        setCurrentUser(data.currentUser || null);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erreur lors du chargement des utilisateurs.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: 'Impossible de joindre le service de gestion des utilisateurs.' });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte.');
      }

      setFeedback({ type: 'success', text: data.message || 'Utilisateur créé avec succès !' });
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      fetchUsersAndProfiles();
      setActiveTab('users');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStartEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'USER');
    setEditPassword('');
    setShowEditPassword(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          password: editPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du compte.');
      }

      setFeedback({ type: 'success', text: data.message || 'Compte mis à jour avec succès !' });
      setEditingUser(null);
      fetchUsersAndProfiles();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setDeleteLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users?id=${deleteConfirmUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      setFeedback({ type: 'success', text: data.message || 'Compte utilisateur supprimé avec succès.' });
      setDeleteConfirmUser(null);
      fetchUsersAndProfiles();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddCustomProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileCode.trim() || !newProfileLabel.trim()) return;

    const code = newProfileCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = profiles.find((p) => p.code === code);
    if (existing) {
      setFeedback({ type: 'error', text: `Le profil "${code}" existe déjà.` });
      return;
    }

    const newProf: ProfileItem = {
      code,
      label: newProfileLabel.trim(),
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      description: newProfileDesc.trim() || 'Profil personnalisé défini par l\'administrateur.',
      permissions: ['Consultation personnalisée', 'Accès selon habilitation'],
    };

    setProfiles((prev) => [...prev, newProf]);
    setNewProfileCode('');
    setNewProfileLabel('');
    setNewProfileDesc('');
    setShowNewProfileForm(false);
    setFeedback({ type: 'success', text: `Profil "${code}" ajouté à la liste des profils disponibles.` });
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'DRH':
      case 'ADMIN_DRH':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'SUPERVISEUR':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'USER':
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'ADMIN':
        return 'Super-Admin';
      case 'DRH':
      case 'ADMIN_DRH':
        return 'Direction DRH';
      case 'SUPERVISEUR':
        return 'Superviseur';
      case 'USER':
      default:
        return 'Agent Terrain';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-orange-950/30 overflow-hidden">
        {/* En-tête de la modale */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Panel d'Administration du Système
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Haute Sécurité
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestion centralisée des comptes utilisateurs, habilitations et profils d'accès
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsersAndProfiles}
              title="Rafraîchir la liste"
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fermer"
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message de notification / feedback */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation des Onglets */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Comptes Utilisateurs ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'create'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nouveau Compte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profiles'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Profils & Permissions ({profiles.length})</span>
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* ONGLET 1 : LISTE DES COMPTES UTILISATEURS                                  */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Barre de recherche et filtres de profil */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom, email ou identifiant..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-orange-500/50 cursor-pointer"
                  >
                    <option value="ALL">Tous les profils</option>
                    <option value="ADMIN">Super-Admin</option>
                    <option value="DRH">Direction DRH</option>
                    <option value="SUPERVISEUR">Superviseur</option>
                    <option value="USER">Agent Terrain</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm shadow-orange-600/30 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Créer un Compte</span>
                  </button>
                </div>
              </div>

              {/* Tableau des utilisateurs */}
              {loading ? (
                <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                  <span>Chargement des comptes utilisateurs...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-14 text-slate-500 text-xs flex flex-col items-center gap-3">
                  <Users className="w-10 h-10 text-slate-600" />
                  <p className="font-semibold text-slate-400">Aucun utilisateur ne correspond aux critères.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRole('ALL');
                    }}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                    <thead>
                      <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Utilisateur</th>
                        <th className="py-3 px-3">Email Professionnel</th>
                        <th className="py-3 px-3 text-center">Profil / Rôle</th>
                        <th className="py-3 px-3">Date de Création</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((u) => {
                        const isSelf = currentUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition">
                            {/* Nom & ID */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 border border-slate-700">
                                  {(u.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.name || 'Sans nom'}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[9px] font-bold border border-orange-500/30">
                                        Vous
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {u.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-3 px-3">
                              <span className="text-slate-300 font-mono text-[11px]">{u.email}</span>
                            </td>

                            {/* Profil */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadge(
                                  u.role
                                )}`}
                              >
                                {getRoleLabel(u.role)}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(u)}
                                  title="Modifier ce compte"
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Modifier</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmUser(u)}
                                  disabled={isSelf}
                                  title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer cet utilisateur'}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : CRÉATION D'UN NOUVEAU COMPTE UTILISATEUR                        */}
          {/* ========================================================================= */}
          {activeTab === 'create' && (
            <div className="max-w-xl mx-auto space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <strong className="text-white">Création administrative de compte :</strong> L'utilisateur recevra ses
                  identifiants de connexion. Seul l'administrateur peut créer des profils DRH, Superviseur ou Saisie Terrain.
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Nom & Prénoms complets *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="ex: KOUASSI Yao Jean"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Adresse Email Professionnelle *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="nom.prenom@mffe.gouv.ci"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Profil & Niveau d'Habilitation *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCreateRole('ADMIN')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                        createRole === 'ADMIN'
                          ? 'bg-red-500/15 border-red-500/50 text-red-300 ring-1 ring-red-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <ShieldCheck className="w-4 h-4 text-red-400" />
                        <span>Super-Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Accès total, comptes & imports</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateRole('DRH')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                        createRole === 'DRH'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Direction DRH</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Consultation des chiffres & reporting</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateRole('SUPERVISEUR')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                        createRole === 'SUPERVISEUR'
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Superviseur</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Contrôle régional & coordination</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateRole('USER')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                        createRole === 'USER'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Agent Terrain</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Saisie des réceptions & livraisons</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Mot de passe initial *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreatePassword(generateRandomPassword())}
                      className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Générer automatiquement</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs transition flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-md shadow-orange-600/30 cursor-pointer"
                  >
                    {createLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Créer le compte utilisateur</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : PROFILS & PERMISSIONS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'profiles' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Matrice des Profils & Droits d'Accès</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Définition des rôles applicatifs et des niveaux de permission dans le système
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProfileForm(!showNewProfileForm)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{showNewProfileForm ? 'Fermer le formulaire' : 'Définir un Nouveau Profil'}</span>
                </button>
              </div>

              {/* Formulaire de définition d'un nouveau profil */}
              {showNewProfileForm && (
                <form
                  onSubmit={handleAddCustomProfile}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Nouveau Profil Utilisateur</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                        Code du Profil (Identifiant) *
                      </label>
                      <input
                        type="text"
                        value={newProfileCode}
                        onChange={(e) => setNewProfileCode(e.target.value)}
                        placeholder="ex: AUDITEUR_REGIONAL"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                        Libellé Officiel *
                      </label>
                      <input
                        type="text"
                        value={newProfileLabel}
                        onChange={(e) => setNewProfileLabel(e.target.value)}
                        placeholder="ex: Auditeur Régional des Dotations"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
                      Description & Périmètre de fonction
                    </label>
                    <textarea
                      value={newProfileDesc}
                      onChange={(e) => setNewProfileDesc(e.target.value)}
                      placeholder="Précisez les prérogatives et structures rattachées à ce profil..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewProfileForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Enregistrer le Profil
                    </button>
                  </div>
                </form>
              )}

              {/* Grille des profils */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profiles.map((p) => {
                  const usersCount = users.filter((u) => u.role === p.code).length;
                  return (
                    <div
                      key={p.code}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.badge}`}>
                            {p.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {usersCount} compte(s) associé(s)
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{p.label}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Permissions Actives :
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.permissions.map((perm, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800 font-medium"
                            >
                              ✓ {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODALE SECONDAIRE : MODIFICATION D'UN UTILISATEUR */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  <span>Modifier le Compte Utilisateur</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Nom & Prénoms complets *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Adresse Email Professionnelle *
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Profil / Rôle Applicatif *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ADMIN">Super-Admin (Accès total)</option>
                    <option value="DRH">Direction DRH (Consultation des chiffres)</option>
                    <option value="SUPERVISEUR">Superviseur Régional</option>
                    <option value="USER">Agent Terrain (Saisie)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase">
                      Nouveau mot de passe (Optionnel)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPassword(generateRandomPassword())}
                      className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Générer
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Laisser vide pour conserver l'actuel"
                      minLength={editPassword ? 6 : undefined}
                      className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {editLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE SECONDAIRE : CONFIRMATION SUPPRESSION */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl p-5 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/40">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-bold text-white text-base">Supprimer cet utilisateur ?</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Voulez-vous vraiment supprimer le compte de{' '}
                  <strong className="text-white">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email}) ?
                </p>
                <p className="text-[11px] text-red-400/90 mt-2 font-medium">
                  Cette action est définitive et révoquera immédiatement tous ses accès.
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  {deleteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

