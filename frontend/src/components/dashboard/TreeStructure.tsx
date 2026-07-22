import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, Users, Building2, Briefcase } from 'lucide-react';

interface Personnel {
  id: number;
  name: string;
  national_code: string;
  is_complete: boolean;
}

interface Unit {
  id: number;
  name: string;
  personnel: Personnel[];
}

interface Department {
  id: number;
  name: string;
  color: string;
  units: Unit[];
}

interface TreeStructureProps {
  departments: Department[];
}

const TreeStructure: React.FC<TreeStructureProps> = ({ departments }) => {
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  const toggleDept = (deptId: number) => {
    const newSet = new Set(expandedDepts);
    if (newSet.has(deptId)) {
      newSet.delete(deptId);
    } else {
      newSet.add(deptId);
    }
    setExpandedDepts(newSet);
  };

  const toggleUnit = (unitId: number) => {
    const newSet = new Set(expandedUnits);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setExpandedUnits(newSet);
  };

  const totalIncomplete = departments.reduce((acc, dept) => {
    return acc + dept.units.reduce((unitAcc, unit) => {
      return unitAcc + unit.personnel.filter(p => !p.is_complete).length;
    }, 0);
  }, 0);

  if (totalIncomplete === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        ✅ همه پرسنل اطلاعات خود را تکمیل کرده‌اند
      </div>
    );
  }

  return (
    <div className="tree-structure max-h-[450px] overflow-y-auto p-2">
      {departments.map((dept) => {
        const deptIncomplete = dept.units.reduce((acc, unit) => {
          return acc + unit.personnel.filter(p => !p.is_complete).length;
        }, 0);

        if (deptIncomplete === 0) return null;

        const isDeptOpen = expandedDepts.has(dept.id);

        return (
          <div key={dept.id} className="mb-4 border-r-4 pl-3 rounded-l-xl bg-white/60 hover:bg-white/90 transition-all" style={{ borderRightColor: dept.color || '#667eea' }}>
            <div 
              className="flex justify-between items-center p-3 bg-sky-50/80 rounded-xl cursor-pointer hover:bg-sky-100/80 transition-all"
              onClick={() => toggleDept(dept.id)}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Building2 size={18} className="text-slate-600" />
                <span>{dept.name}</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {deptIncomplete} ناقص
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {dept.units.length} واحد
                </span>
                {isDeptOpen ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
              </div>
            </div>

            {isDeptOpen && (
              <div className="mr-4 mt-2 space-y-2">
                {dept.units.map((unit) => {
                  const unitIncomplete = unit.personnel.filter(p => !p.is_complete).length;
                  if (unitIncomplete === 0) return null;

                  const isUnitOpen = expandedUnits.has(unit.id);

                  return (
                    <div key={unit.id} className="border-r-2 pl-2 rounded-r-lg bg-white/40">
                      <div 
                        className="flex justify-between items-center p-2 bg-slate-50/80 rounded-lg cursor-pointer hover:bg-slate-100/80 transition-all text-sm"
                        onClick={() => toggleUnit(unit.id)}
                      >
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                          <Briefcase size={16} />
                          <span>{unit.name}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            {unitIncomplete} ناقص
                          </span>
                        </div>
                        {isUnitOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                      </div>

                      {isUnitOpen && (
                        <div className="mr-4 mt-1 space-y-1">
                          {unit.personnel.filter(p => !p.is_complete).map((p) => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-white/60 rounded-lg text-sm hover:bg-white transition-all">
                              <div className="flex items-center gap-2">
                                <Users size={14} className="text-slate-400" />
                                <span className="text-slate-700">{p.name || p.national_code}</span>
                              </div>
                              <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                {p.national_code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TreeStructure;