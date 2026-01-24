
import { Injectable, signal, computed } from '@angular/core';

export interface LotteryRecord {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  am: string;   // "00" to "99"
  pm: string;   // "00" to "99"
  set?: string; // Market Set Index
  value?: string; // Market Value
  dayOfWeek: string;
}

export interface AIWeights {
  recency: number;   // Weight for recent trends
  seasonal: number;  // Weight for yearly patterns
  dayOfWeek: number; // Weight for specific day logic
  market: number;    // Weight for Set/Value math
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly STORAGE_KEY = 'futureworld_2d_data_v5'; 
  private readonly WEIGHTS_KEY = 'futureworld_ai_weights';

  // Default Weights
  private readonly DEFAULT_WEIGHTS: AIWeights = {
    recency: 0.4,
    seasonal: 0.2,
    dayOfWeek: 0.2,
    market: 0.2
  };
  
  // State
  records = signal<LotteryRecord[]>([]);
  aiWeights = signal<AIWeights>(this.DEFAULT_WEIGHTS);

  // Computed
  latestRecord = computed(() => this.records().length > 0 ? this.records()[0] : null);
  totalRecords = computed(() => this.records().length);

  constructor() {
    this.loadData();
    this.loadWeights();
  }

  private loadData() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.records.set(parsed);
      } catch (e) {
        console.error('Data corrupted, resetting DB');
        this.seedDatabase();
      }
    } else {
      this.seedDatabase();
    }
  }

  private loadWeights() {
    const stored = localStorage.getItem(this.WEIGHTS_KEY);
    if (stored) {
      try {
        this.aiWeights.set(JSON.parse(stored));
      } catch {
        this.aiWeights.set(this.DEFAULT_WEIGHTS);
      }
    }
  }

  updateWeights(newWeights: AIWeights) {
    this.aiWeights.set(newWeights);
    localStorage.setItem(this.WEIGHTS_KEY, JSON.stringify(newWeights));
  }

  addRecord(date: string, am: string, pm: string, set?: string, value?: string) {
    this.records.update(prev => {
      const existingIndex = prev.findIndex(r => r.date === date);
      const newRecord: LotteryRecord = {
        id: existingIndex >= 0 ? prev[existingIndex].id : crypto.randomUUID(),
        date,
        am,
        pm,
        set,
        value,
        dayOfWeek: this.getDayName(date)
      };

      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = newRecord;
      } else {
        updated = [newRecord, ...prev];
      }
      
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.saveToStorage(updated);
      return updated;
    });
  }

  importBulk(text: string): { count: number, errors: number } {
    // 1. Pre-cleaning
    const cleanText = text.replace(/[^\x00-\x7F\n]/g, "") 
                          .replace(/\r\n/g, "\n");

    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
    let count = 0;
    let errors = 0;
    const newRecordsMap = new Map<string, Partial<LotteryRecord>>();

    // Regex Definitions
    const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(s);
    const isTime = (s: string) => /^\d{1,2}:\d{2}\s*(?:AM|PM)?|00:00$/.test(s);
    const isSetLabel = (s: string) => s.toLowerCase() === 'set';
    const isValueLabel = (s: string) => s.toLowerCase() === 'value';
    const is2DLabel = (s: string) => s.toUpperCase() === '2D';
    const isNumber = (s: string) => /^\d{1,3}(?:,\d{3})*(?:\.\d+)?$/.test(s); 
    const is2DResult = (s: string) => /^\d{2}$/.test(s);

    let currentDate: string | null = null;
    let lastTime: string | null = null;
    let pendingSet: string | null = null;
    let pendingValue: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isDate(line)) {
        currentDate = this.parseDate(line);
        if (currentDate) {
           if (!newRecordsMap.has(currentDate)) {
             newRecordsMap.set(currentDate, { date: currentDate });
           }
        } else {
          errors++;
        }
        continue;
      }

      if (isTime(line)) {
        lastTime = line;
        continue;
      }

      if (isSetLabel(line) && lines[i+1] && isNumber(lines[i+1])) {
        pendingSet = lines[i+1];
        i++; 
        continue;
      }
      if (isValueLabel(line) && lines[i+1] && isNumber(lines[i+1])) {
        pendingValue = lines[i+1];
        i++; 
        continue;
      }

      if (is2DLabel(line)) continue;
      
      if (is2DResult(line)) {
        if (currentDate && lastTime) {
          const rec = newRecordsMap.get(currentDate)!;
          if (lastTime.includes('11:00') || lastTime.includes('12:00') || lastTime.includes('00:00')) {
             if (!rec.am || lastTime.includes('00:00')) rec.am = line;
             if (pendingSet) rec.set = pendingSet;
             if (pendingValue) rec.value = pendingValue;
          } else {
             if (!rec.pm) rec.pm = line;
             if (pendingSet) rec.set = pendingSet;
             if (pendingValue) rec.value = pendingValue;
          }
        }
        pendingSet = null;
        pendingValue = null;
      }
    }

    newRecordsMap.forEach((rec) => {
      if (rec.date && rec.am && rec.pm) {
        this.addRecord(rec.date, rec.am, rec.pm, rec.set, rec.value);
        count++;
      } else {
        errors++;
      }
    });

    return { count, errors };
  }

  deleteRecord(id: string) {
    this.records.update(prev => {
      const updated = prev.filter(r => r.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clearAll() {
    this.records.set([]);
    this.saveToStorage([]);
  }

  private saveToStorage(data: LotteryRecord[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Storage full', e);
    }
  }

  getDayName(dateStr: string): string {
    const days = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
    return days[new Date(dateStr).getDay()];
  }

  private parseDate(input: string): string | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const match = input.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})$/); 
    if (match) {
       const d = match[1].padStart(2, '0');
       const m = match[2].padStart(2, '0');
       let y = match[3];
       if (y.length === 2) y = "20" + y; 
       return `${y}-${m}-${d}`;
    }
    return null;
  }

  private seedDatabase() {
    const rawData = [
      { date: '2026-01-23', am: '43', pm: '91', set: '1,314.39', value: '50,901.86' },
      { date: '2026-01-22', am: '42', pm: '44', set: '1,311.64', value: '72,724.01' },
      { date: '2026-01-21', am: '71', pm: '68' },
      { date: '2026-01-20', am: '31', pm: '76' },
      { date: '2026-01-19', am: '45', pm: '05' },
      { date: '2026-01-16', am: '72', pm: '03' },
      { date: '2026-01-15', am: '04', pm: '96' },
      { date: '2026-01-14', am: '28', pm: '07' }
    ];

    const data: LotteryRecord[] = rawData.map(r => ({
      id: crypto.randomUUID(),
      date: r.date,
      am: r.am,
      pm: r.pm,
      set: r.set,
      value: r.value,
      dayOfWeek: this.getDayName(r.date)
    }));
    
    this.records.set(data);
    this.saveToStorage(data);
  }
}
