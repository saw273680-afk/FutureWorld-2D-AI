
import { Injectable, signal, computed } from '@angular/core';

export interface LotteryRecord {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  am: string;   // "00" to "99"
  pm: string;   // "00" to "99"
  dayOfWeek: string;
}

export interface AIWeights {
  recency: number;
  seasonal: number;
  dayOfWeek: number;
  relationship: number; // For Power, Nakhat, Brother
  trend: number;     // For Head/Tail trends
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly STORAGE_KEY = 'futureworld_2d_data_v6'; 
  private readonly WEIGHTS_KEY = 'futureworld_ai_weights_v6';
  private readonly API_KEY_KEY = 'futureworld_gemini_api_key';

  // Rebalanced weights after removing the 'market' expert.
  private readonly DEFAULT_WEIGHTS: AIWeights = {
    recency: 0.30,
    relationship: 0.35,
    trend: 0.25,
    seasonal: 0.05,
    dayOfWeek: 0.05,
  };
  
  // State
  records = signal<LotteryRecord[]>([]);
  aiWeights = signal<AIWeights>(this.DEFAULT_WEIGHTS);
  apiKey = signal<string>('');

  // Computed
  latestRecord = computed(() => this.records().length > 0 ? this.records()[0] : null);
  totalRecords = computed(() => this.records().length);

  constructor() {
    this.loadData();
    this.loadWeights();
    this.loadApiKey();
  }
  
  private _generateId(): string {
    // A simple, universally compatible unique ID generator to prevent crashes.
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private loadApiKey() {
    const key = localStorage.getItem(this.API_KEY_KEY);
    this.apiKey.set(key || '');
  }

  updateApiKey(key: string) {
    this.apiKey.set(key);
    localStorage.setItem(this.API_KEY_KEY, key);
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
        const loadedWeights = JSON.parse(stored);
        // Ensure new properties exist and old ones (market) are removed
        const cleanWeights = { ...this.DEFAULT_WEIGHTS, ...loadedWeights };
        delete (cleanWeights as any).market; // Safely remove old property if it exists
        this.aiWeights.set(cleanWeights);
      } catch {
        this.aiWeights.set(this.DEFAULT_WEIGHTS);
      }
    } else {
      this.aiWeights.set(this.DEFAULT_WEIGHTS);
    }
  }

  updateWeights(newWeights: AIWeights) {
    this.aiWeights.set(newWeights);
    localStorage.setItem(this.WEIGHTS_KEY, JSON.stringify(newWeights));
  }

  addRecord(date: string, am: string, pm: string) {
    this.records.update(prev => {
      const existingIndex = prev.findIndex(r => r.date === date);
      const newRecord: LotteryRecord = {
        id: existingIndex >= 0 ? prev[existingIndex].id : this._generateId(),
        date,
        am,
        pm,
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

  parseImportData(text: string): { successful: {date: string, am: string, pm: string}[], errors: string[] } {
    const cleanText = text.replace(/[^\x00-\x7F\n]/g, "").replace(/\r\n/g, "\n");
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
    const errors: string[] = [];
    const newRecordsMap = new Map<string, Partial<LotteryRecord>>();

    const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(s);
    const isTime = (s: string) => /^\d{1,2}:\d{2}\s*(?:AM|PM)?|00:00$/.test(s);
    const is2DResult = (s: string) => /^\d{2}$/.test(s);

    let currentDate: string | null = null;
    let lastTime: string | null = null;
    let currentLineNumber = 0;

    for (const line of lines) {
        currentLineNumber++;
        if (!line) continue;

        if (isDate(line)) {
            currentDate = this.parseDate(line);
            if (currentDate) {
                if (!newRecordsMap.has(currentDate)) newRecordsMap.set(currentDate, { date: currentDate });
            } else {
                errors.push(`Line ${currentLineNumber}: "${line}" - နေ့စွဲပုံစံ မမှန်ပါ။`);
            }
            lastTime = null; // Reset time on new date
            continue;
        }

        if (isTime(line)) {
            lastTime = line;
            continue;
        }

        if (is2DResult(line)) {
            if (currentDate) {
                const rec = newRecordsMap.get(currentDate)!;
                if (lastTime) {
                    if (lastTime.includes('11:00') || lastTime.includes('12:00') || lastTime.includes('00:00')) {
                        rec.am = line;
                    } else {
                        rec.pm = line;
                    }
                } else {
                    // If no time is specified, assume AM then PM
                    if (!rec.am) rec.am = line;
                    else if (!rec.pm) rec.pm = line;
                }
            } else {
                 errors.push(`Line ${currentLineNumber}: "${line}" - ဂဏန်းတွေ့သော်လည်း နေ့စွဲသတ်မှတ်မထားပါ။`);
            }
            continue;
        }
        
        errors.push(`Line ${currentLineNumber}: "${line}" - အချက်အလက် နားမလည်ပါ။`);
    }
    
    const successful: {date: string, am: string, pm: string}[] = [];
    newRecordsMap.forEach((rec, key) => {
        if (rec.date && rec.am && rec.pm) {
            successful.push({ date: rec.date, am: rec.am, pm: rec.pm });
        } else {
            errors.push(`Date ${key}: မနက် သို့မဟုတ် ညနေဂဏန်း မပြည့်စုံပါ။`);
        }
    });

    return { successful, errors };
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
      { date: '2026-01-23', am: '43', pm: '91' },
      { date: '2026-01-22', am: '42', pm: '44' },
      { date: '2026-01-21', am: '71', pm: '68' },
      { date: '2026-01-20', am: '31', pm: '76' },
      { date: '2026-01-19', am: '45', pm: '05' },
      { date: '2026-01-16', am: '72', pm: '03' },
      { date: '2026-01-15', am: '04', pm: '96' },
      { date: '2026-01-14', am: '28', pm: '07' }
    ];

    const data: LotteryRecord[] = rawData.map(r => ({
      id: this._generateId(),
      date: r.date,
      am: r.am,
      pm: r.pm,
      dayOfWeek: this.getDayName(r.date)
    }));
    
    this.records.set(data);
    this.saveToStorage(data);
  }
}
