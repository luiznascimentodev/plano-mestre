'use client';

import { useState } from 'react';
import { apiPrivate } from '@/lib/api';
import { AxiosError } from 'axios';
import { analytics } from '@/lib/analytics';
import {
  TagIcon,
  CalendarIcon,
  FlagIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface Props {
  onTopicCreated: () => void;
  initialData?: {
    name?: string;
    category?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    description?: string;
    tags?: string;
    color?: string;
  };
  isExpanded?: boolean;
}

export default function CreateTopicForm({
  onTopicCreated,
  initialData,
  isExpanded = false
}: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | ''>(
    initialData?.priority || ''
  );
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(isExpanded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = { name: name.trim() };

      if (category.trim()) payload.category = category.trim();
      if (priority) payload.priority = priority;
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      if (description.trim()) payload.description = description.trim();
      if (tags.trim()) payload.tags = tags.trim();
      if (color.trim()) payload.color = color.trim();

      const response = await apiPrivate.post('/topics', payload);

      if (response.data?.id) {
        analytics.trackTopicCreated(response.data.id, response.data.name);
      }

      setName('');
      setCategory('');
      setPriority('');
      setDueDate('');
      setDescription('');
      setTags('');
      setColor('');
      setShowAdvanced(false);

      onTopicCreated();
    } catch(err){
      if (err instanceof AxiosError && err.response?.status === 400){
        setError('O nome do assunto é inválido ou muito longo.');
      } else {
        setError('Erro ao salvar o assunto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const presetColors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Ciano', value: '#06B6D4' },
    { name: 'Laranja', value: '#F97316' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Nome (obrigatório) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Nome do Assunto <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Controle de Constitucionalidade"
          required
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Campos básicos em linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            <TagIcon className="w-4 h-4 inline mr-1" />
            Categoria
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Direito, Matemática..."
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            <FlagIcon className="w-4 h-4 inline mr-1" />
            Prioridade
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | '')}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
          >
            <option value="">Selecione...</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
          </select>
        </div>
      </div>

      {/* Data Limite */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Data Limite (opcional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descrição sobre o assunto..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{description.length}/500</p>
      </div>

      {/* Campos Avançados (colapsável) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {showAdvanced ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
          <span>Campos Avançados (opcional)</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <TagIcon className="w-4 h-4 inline mr-1" />
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: constitucional, direito, prova"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Separe múltiplas tags com vírgulas
              </p>
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <PaintBrushIcon className="w-4 h-4 inline mr-1" />
                Cor Personalizada
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        color === preset.value
                          ? 'border-slate-900 dark:border-slate-100 scale-110 shadow-md'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color || '#3B82F6'}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setColor(value);
                      }
                    }}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {color && (
                    <button
                      type="button"
                      onClick={() => setColor('')}
                      className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-2.5 font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar Assunto'}
        </button>
      </div>
    </form>
  );
}
