import React, { useState } from 'react';
import { Recipe, ManualSection } from '../types';
import { Search, Coffee, FileText, Plus, Edit3, Trash2, Save, GripVertical, X } from 'lucide-react';

interface RecipeBookProps {
  manual: ManualSection[];
  recipes: Recipe[];
  isManager?: boolean;
  onUpdateRecipes?: (recipes: Recipe[]) => void;
}

const RecipeBook: React.FC<RecipeBookProps> = ({ manual, recipes, isManager = false, onUpdateRecipes }) => {
  const [activeView, setActiveView] = useState<'RECIPES' | 'MANUAL'>('RECIPES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Edit State
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Derive categories from recipes
  const categories = ['ALL', ...Array.from(new Set(recipes.map(r => r.category)))];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredManual = manual.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveRecipe = () => {
    if (!editingRecipe || !onUpdateRecipes) return;
    const exists = recipes.find(r => r.id === editingRecipe.id);
    let nextRecipes;
    if (exists) {
      nextRecipes = recipes.map(r => r.id === editingRecipe.id ? editingRecipe : r);
    } else {
      nextRecipes = [...recipes, editingRecipe];
    }
    onUpdateRecipes(nextRecipes);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    if (!onUpdateRecipes || !confirm('Are you sure you want to delete this recipe card?')) return;
    onUpdateRecipes(recipes.filter(r => r.id !== id));
  };

  const handleCreateRecipe = () => {
    setEditingRecipe({
      id: `r-${Date.now()}`,
      title: 'New Recipe Card',
      category: selectedCategory === 'ALL' ? 'General' : selectedCategory,
      type: 'STANDARD',
      steps: ['Step 1...']
    });
  };

  const renderCardContent = (recipe: Recipe) => {
    switch (recipe.type) {
      case 'ESPRESSO':
        return (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
              <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Dose</p>
              <p className="text-sm font-black text-[#001F3F]">{recipe.dose}</p>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
              <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Yield</p>
              <p className="text-sm font-black text-[#001F3F]">{recipe.yield}</p>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
              <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Time</p>
              <p className="text-sm font-black text-[#001F3F]">{recipe.time}</p>
            </div>
          </div>
        );
      case 'GRID':
        return (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {recipe.gridColumns?.map((col, i) => (
                    <th key={i} className="text-[8px] font-black text-neutral-400 uppercase tracking-widest pb-2 border-b border-neutral-100 pr-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipe.gridRows?.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-50 last:border-0">
                    <td className="py-3 pr-4 font-bold text-[#001F3F] text-xs">{row.label}</td>
                    {row.values.map((val, vi) => (
                      <td key={vi} className="py-3 pr-4 text-xs font-medium text-neutral-600">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'BATCH':
        return (
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-50">
              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Ingredients</p>
              <div className="grid grid-cols-2 gap-y-2">
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-bold text-[#001F3F]">{ing.quantity}</span> <span className="text-neutral-500">{ing.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {recipe.steps && recipe.steps.length > 0 && (
               <ul className="space-y-1">
                 {recipe.steps.map((step, i) => (
                   <li key={i} className="flex gap-2 text-xs font-medium text-neutral-600">
                     <span className="text-blue-300 font-bold">•</span> {step}
                   </li>
                 ))}
               </ul>
            )}
          </div>
        );
      default: // STANDARD
        return (
          <div className="mt-4 space-y-3">
             {recipe.ingredients && recipe.ingredients.length > 0 && (
               <div className="flex flex-wrap gap-2">
                 {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-100 text-[10px]">
                      <span className="font-bold text-[#001F3F]">{ing.quantity}</span> <span className="text-neutral-500">{ing.name}</span>
                    </div>
                 ))}
               </div>
             )}
             {recipe.steps && (
               <div className="space-y-2">
                 {recipe.steps.map((step, i) => (
                   <div key={i} className="flex gap-3 items-start">
                     <span className="text-[9px] font-black text-blue-300 mt-0.5">0{i + 1}</span>
                     <p className="text-xs font-medium text-neutral-600 leading-relaxed">{step}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        );
    }
  };

  const renderEditor = () => {
    if (!editingRecipe) return null;
    return (
      <div className="fixed inset-0 z-[60] bg-[#001F3F]/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Edit Recipe Card</h3>
            <button onClick={() => setEditingRecipe(null)} className="p-2 hover:bg-neutral-100 rounded-full"><X size={20}/></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Title</label>
                 <input 
                   value={editingRecipe.title} 
                   onChange={e => setEditingRecipe({...editingRecipe, title: e.target.value})}
                   className="w-full border border-neutral-200 rounded-xl px-3 py-2 font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#001F3F]/10"
                 />
               </div>
               <div>
                 <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Category</label>
                 <input 
                   value={editingRecipe.category} 
                   onChange={e => setEditingRecipe({...editingRecipe, category: e.target.value})}
                   className="w-full border border-neutral-200 rounded-xl px-3 py-2 font-bold text-[#001F3F] outline-none focus:ring-2 focus:ring-[#001F3F]/10"
                 />
               </div>
             </div>

             <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Card Type</label>
                <div className="flex gap-2">
                  {(['ESPRESSO', 'GRID', 'BATCH', 'STANDARD'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setEditingRecipe({...editingRecipe, type: t})}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                        editingRecipe.type === t ? 'bg-[#001F3F] text-white border-[#001F3F]' : 'bg-white text-neutral-400 border-neutral-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </div>

             {/* Type Specific Fields */}
             {editingRecipe.type === 'ESPRESSO' && (
                <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl">
                  <input placeholder="Dose (e.g. 18g)" value={editingRecipe.dose || ''} onChange={e => setEditingRecipe({...editingRecipe, dose: e.target.value})} className="border p-2 rounded-lg text-xs" />
                  <input placeholder="Yield (e.g. 36g)" value={editingRecipe.yield || ''} onChange={e => setEditingRecipe({...editingRecipe, yield: e.target.value})} className="border p-2 rounded-lg text-xs" />
                  <input placeholder="Time (e.g. 30s)" value={editingRecipe.time || ''} onChange={e => setEditingRecipe({...editingRecipe, time: e.target.value})} className="border p-2 rounded-lg text-xs" />
                </div>
             )}

             {editingRecipe.type === 'GRID' && (
                <div className="space-y-4 bg-neutral-50 p-4 rounded-xl">
                   <div>
                     <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Columns (comma separated)</label>
                     <input 
                       value={editingRecipe.gridColumns?.join(', ') || ''}
                       onChange={e => setEditingRecipe({...editingRecipe, gridColumns: e.target.value.split(',').map(s => s.trim())})}
                       className="w-full border p-2 rounded-lg text-xs"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Rows (Label | Val1, Val2...)</label>
                     {editingRecipe.gridRows?.map((row, idx) => (
                       <div key={idx} className="flex gap-2">
                         <input 
                           value={row.label}
                           onChange={e => {
                             const newRows = [...(editingRecipe.gridRows || [])];
                             newRows[idx].label = e.target.value;
                             setEditingRecipe({...editingRecipe, gridRows: newRows});
                           }}
                           className="w-1/3 border p-2 rounded-lg text-xs font-bold"
                           placeholder="Label"
                         />
                         <input 
                           value={row.values.join(', ')}
                           onChange={e => {
                             const newRows = [...(editingRecipe.gridRows || [])];
                             newRows[idx].values = e.target.value.split(',').map(s => s.trim());
                             setEditingRecipe({...editingRecipe, gridRows: newRows});
                           }}
                           className="flex-1 border p-2 rounded-lg text-xs"
                           placeholder="Values (comma sep)"
                         />
                         <button onClick={() => {
                           const newRows = editingRecipe.gridRows?.filter((_, i) => i !== idx);
                           setEditingRecipe({...editingRecipe, gridRows: newRows});
                         }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button 
                       onClick={() => setEditingRecipe({...editingRecipe, gridRows: [...(editingRecipe.gridRows || []), { label: 'New Row', values: [] }]})}
                       className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"
                     >
                       <Plus size={12}/> Add Row
                     </button>
                   </div>
                </div>
             )}

             {(editingRecipe.type === 'BATCH' || editingRecipe.type === 'STANDARD') && (
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-xl space-y-2">
                     <label className="text-[10px] font-bold text-neutral-400 uppercase block">Ingredients</label>
                     {editingRecipe.ingredients?.map((ing, i) => (
                       <div key={i} className="flex gap-2">
                         <input 
                           placeholder="Qty" 
                           value={ing.quantity}
                           onChange={e => {
                             const newIng = [...(editingRecipe.ingredients || [])];
                             newIng[i].quantity = e.target.value;
                             setEditingRecipe({...editingRecipe, ingredients: newIng});
                           }}
                           className="w-1/4 border p-2 rounded-lg text-xs"
                         />
                         <input 
                           placeholder="Name" 
                           value={ing.name}
                           onChange={e => {
                             const newIng = [...(editingRecipe.ingredients || [])];
                             newIng[i].name = e.target.value;
                             setEditingRecipe({...editingRecipe, ingredients: newIng});
                           }}
                           className="flex-1 border p-2 rounded-lg text-xs"
                         />
                         <button onClick={() => {
                            const newIng = editingRecipe.ingredients?.filter((_, idx) => idx !== i);
                            setEditingRecipe({...editingRecipe, ingredients: newIng});
                         }} className="text-red-500"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button onClick={() => setEditingRecipe({...editingRecipe, ingredients: [...(editingRecipe.ingredients || []), { name: '', quantity: '' }]})} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Plus size={12}/> Add Ingredient</button>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-xl space-y-2">
                     <label className="text-[10px] font-bold text-neutral-400 uppercase block">Steps</label>
                     {editingRecipe.steps?.map((step, i) => (
                       <div key={i} className="flex gap-2">
                         <textarea 
                           value={step}
                           rows={2}
                           onChange={e => {
                             const newSteps = [...(editingRecipe.steps || [])];
                             newSteps[i] = e.target.value;
                             setEditingRecipe({...editingRecipe, steps: newSteps});
                           }}
                           className="flex-1 border p-2 rounded-lg text-xs resize-none"
                         />
                          <button onClick={() => {
                            const newSteps = editingRecipe.steps?.filter((_, idx) => idx !== i);
                            setEditingRecipe({...editingRecipe, steps: newSteps});
                         }} className="text-red-500"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button onClick={() => setEditingRecipe({...editingRecipe, steps: [...(editingRecipe.steps || []), '']})} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><Plus size={12}/> Add Step</button>
                  </div>
                </div>
             )}

             <div className="space-y-2">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Notes</label>
               <textarea 
                 value={editingRecipe.notes || ''}
                 onChange={e => setEditingRecipe({...editingRecipe, notes: e.target.value})}
                 className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm outline-none"
                 rows={3}
               />
             </div>
          </div>
          <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
             <button onClick={() => setEditingRecipe(null)} className="px-6 py-3 rounded-xl font-bold text-neutral-400 hover:bg-neutral-200 transition-colors text-xs uppercase tracking-widest">Cancel</button>
             <button onClick={handleSaveRecipe} className="px-6 py-3 rounded-xl font-black text-white bg-[#001F3F] hover:bg-blue-900 transition-colors text-xs uppercase tracking-widest flex items-center gap-2"><Save size={14}/> Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-6xl font-[900] text-[#001F3F] tracking-tighter mb-2 leading-none uppercase">Standards</h1>
          <p className="text-neutral-500 font-medium text-base">The Official Boundaries Operations Source of Truth.</p>
        </div>
        <div className="flex items-center gap-3">
          {isManager && activeView === 'RECIPES' && (
            <button 
              onClick={handleCreateRecipe}
              className="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Card
            </button>
          )}
        </div>
      </header>

      <div className="flex bg-neutral-100 p-1 rounded-[1.5rem] w-fit">
        <button 
          onClick={() => setActiveView('RECIPES')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeView === 'RECIPES' ? 'bg-white text-[#001F3F] shadow-sm' : 'text-neutral-400'}`}
        >
          <Coffee size={14} /> Recipe Book
        </button>
        <button 
          onClick={() => setActiveView('MANUAL')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeView === 'MANUAL' ? 'bg-white text-[#001F3F] shadow-sm' : 'text-neutral-400'}`}
        >
          <FileText size={14} /> Ops Manual
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-[#001F3F] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${activeView.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-100 rounded-2xl font-bold text-[#001F3F] focus:ring-4 focus:ring-blue-900/5 outline-none transition-all"
          />
        </div>
        {activeView === 'RECIPES' && (
          <div className="flex bg-neutral-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-[#001F3F] text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeView === 'RECIPES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:border-[#001F3F]/20 transition-all duration-500 relative">
              {isManager && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => setEditingRecipe(recipe)} className="p-2 bg-white text-[#001F3F] rounded-full shadow border border-neutral-100 hover:bg-neutral-50"><Edit3 size={14}/></button>
                  <button onClick={() => handleDeleteRecipe(recipe.id)} className="p-2 bg-white text-red-500 rounded-full shadow border border-neutral-100 hover:bg-red-50"><Trash2 size={14}/></button>
                </div>
              )}
              
              <div className="p-8 h-full flex flex-col">
                <div className="mb-4">
                   <div className="flex justify-between items-start">
                     <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-full mb-3 inline-block ${
                       recipe.type === 'ESPRESSO' ? 'bg-[#001F3F] text-white' : 
                       recipe.type === 'GRID' ? 'bg-blue-50 text-blue-500' : 
                       'bg-neutral-100 text-neutral-500'
                     }`}>
                       {recipe.category}
                     </span>
                   </div>
                   <h3 className="text-2xl font-[900] text-[#001F3F] uppercase tracking-tight leading-none">
                     {recipe.title}
                   </h3>
                </div>

                <div className="flex-1">
                   {renderCardContent(recipe)}
                </div>

                {recipe.notes && (
                  <div className="mt-6 pt-4 border-t border-neutral-50 text-[10px] text-neutral-400 font-medium italic">
                    Note: {recipe.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredRecipes.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-100 rounded-[3rem] text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
               No recipes found matching your filters.
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredManual.map(section => (
            <div key={section.id} className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center font-black text-[#001F3F] text-xl border border-neutral-100">
                  {section.number}
                </div>
                <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight">{section.title}</h3>
              </div>
              <div className="prose prose-neutral max-w-none text-neutral-600 font-medium whitespace-pre-wrap leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {renderEditor()}
    </div>
  );
};

export default RecipeBook;