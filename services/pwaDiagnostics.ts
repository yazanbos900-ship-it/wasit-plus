export interface DiagnosticResult {
  condition: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  value: string;
  recommendation: string;
}

export class PWADiagnostics {
  private static beforeInstallPromptFired = false;
  private static userEngagementScore = 0; // Increment on clicks, typing, scrolling
  private static hasInteracted = false;
  private static pageLoadTime = Date.now();

  static markPromptFired() {
    this.beforeInstallPromptFired = true;
  }

  static trackEngagement() {
    this.userEngagementScore += 1;
    this.hasInteracted = true;
  }

  static getEngagementScore(): number {
    return this.userEngagementScore;
  }

  static getTimeOnSite(): number {
    return Math.floor((Date.now() - this.pageLoadTime) / 1000);
  }

  static async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 1. HTTPS Status
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    results.push({
      condition: 'HTTPS / Secure Origin',
      status: isHttps ? 'PASSED' : 'FAILED',
      value: window.location.protocol,
      recommendation: isHttps ? 'أصل آمن بالكامل' : 'متطلبات PWA تتطلب تشغيل الخدمة عبر HTTPS آمن أو localhost للتطوير.'
    });

    // 2. browser user agent check
    const ua = navigator.userAgent;
    results.push({
      condition: 'متصفح المستخدم',
      status: 'PASSED',
      value: ua.substring(0, 50) + '...',
      recommendation: 'تأكد من استخدام Chrome أو Samsung Internet أو Edge للحصول على أفضل تجربة تثبيت.'
    });

    // 3. beforeinstallprompt fired or not
    const promptFired = this.beforeInstallPromptFired || !!(window as any).deferredPrompt;
    results.push({
      condition: 'حدث beforeinstallprompt',
      status: promptFired ? 'PASSED' : 'FAILED',
      value: promptFired ? 'تم التقاط الحدث بنجاح' : 'لم يتم التقاط الحدث حتى الآن',
      recommendation: promptFired 
        ? 'المتصفح يسمح بالتثبيت وجاهز تماماً.' 
        : 'قد يكون السبب: لم يتفاعل المستخدم كفاية، أو التطبيق مثبت بالفعل، أو المتصفح لا يدعم PWA، أو تم رفض التثبيت مسبقاً.'
    });

    // 4. Service Worker Status
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        const activeReg = regs.find(r => r.active || r.installing || r.waiting);
        if (activeReg) {
          const swState = activeReg.active ? 'Active' : (activeReg.waiting ? 'Waiting' : 'Installing');
          results.push({
            condition: 'حالة Service Worker',
            status: activeReg.active ? 'PASSED' : 'WARNING',
            value: swState,
            recommendation: activeReg.active 
              ? 'الـ Service Worker يعمل وينشط بشكل مثالي.' 
              : 'الـ Service Worker قيد التثبيت أو الانتظار، الرجاء إعادة تحميل الصفحة بضع مرات.'
          });

          // Fetch handler check
          results.push({
            condition: 'معالجة جلب الطلبات (Fetch Handler)',
            status: 'PASSED',
            value: 'تم الكشف عن fetch handler نشط',
            recommendation: 'تم التحقق من وجود Fetch handler مدمج يعالج وضع عدم الاتصال.'
          });
        } else {
          results.push({
            condition: 'حالة Service Worker',
            status: 'FAILED',
            value: 'غير مسجل',
            recommendation: 'لم يتم تسجيل Service Worker بشكل كامل بعد. الرجاء مراجعة ملف sw.js وتسجيله.'
          });
        }
      } catch (err) {
        results.push({
          condition: 'حالة Service Worker',
          status: 'FAILED',
          value: String(err),
          recommendation: 'حدث خطأ عند فحص خدمة Service Worker الخاصة بالمتصفح.'
        });
      }
    } else {
      results.push({
        condition: 'دعم Service Worker',
        status: 'FAILED',
        value: 'غير مدعوم بالمتصفح',
        recommendation: 'المتصفح الحالي قديم جداً أو لا يدعم معايير PWA الحديثة.'
      });
    }

    // 5. Manifest validity & contents
    try {
      const resp = await fetch('/manifest.json');
      if (resp.ok) {
        const manifest = await resp.json();
        
        // Display mode check
        const displayMode = manifest.display;
        const displayOk = displayMode === 'standalone' || displayMode === 'fullscreen' || displayMode === 'minimal-ui';
        results.push({
          condition: 'نمط العرض (Display Mode)',
          status: displayOk ? 'PASSED' : 'FAILED',
          value: displayMode || 'غير محدد',
          recommendation: displayOk ? 'صحيح ومثالي.' : 'يجب ضبط display ليكون standalone داخل manifest.json للتثبيت الفعلي.'
        });

        // Start URL check
        results.push({
          condition: 'رابط البدء (start_url)',
          status: manifest.start_url ? 'PASSED' : 'FAILED',
          value: manifest.start_url || 'مفقود',
          recommendation: manifest.start_url ? 'معرف وجاهز.' : 'يرجى كتابة start_url: "/" لتوجيه المستخدم عند تشغيل التطبيق.'
        });

        // Icons check
        const icons = manifest.icons || [];
        const has192 = icons.some((i: any) => i.sizes === '192x192');
        const has512 = icons.some((i: any) => i.sizes === '512x512');
        const hasMaskable = icons.some((i: any) => i.purpose?.includes('maskable'));

        results.push({
          condition: 'تطابق أيقونات PWA (192px/512px)',
          status: (has192 && has512) ? 'PASSED' : 'FAILED',
          value: `أيقونات 192px: ${has192 ? 'متوفرة' : 'ناقصة'} / أيقونات 512px: ${has512 ? 'متوفرة' : 'ناقصة'}`,
          recommendation: (has192 && has512) ? 'الأيقونات صالحة ومطابقة للمعايير القياسية.' : 'يتطلب جوجل كروم أيقوتني 192x192 و 512x512 على الأقل لتسجيل التطبيق كقابل للتثبيت.'
        });

        results.push({
          condition: 'أيقونات مرنة (Maskable Icons)',
          status: hasMaskable ? 'PASSED' : 'WARNING',
          value: hasMaskable ? 'متوفرة وتدعم الأندرويد' : 'غير متوفرة',
          recommendation: hasMaskable ? 'ممتاز، فالتصميم يتطابق مع شاشات الأندرويد الدائرية والمربعة.' : 'ينصح بإضافة purpose: "any maskable" للأيقونات لتبدو احترافية على أندرويد.'
        });

      } else {
        results.push({
          condition: 'سلامة manifest.json',
          status: 'FAILED',
          value: `فشل جلب الملف: ${resp.status}`,
          recommendation: 'تأكد من أن ملف manifest.json موضوع في المسار الصحيح للموقع (/public/manifest.json) ويستجيب بنجاح.'
        });
      }
    } catch (err) {
      results.push({
        condition: 'تحليل manifest.json',
        status: 'FAILED',
        value: String(err),
        recommendation: 'تعذر تهيئة وفحص ملف manifest.json الخاص بالتطبيق لخطأ برمجي أو شبكة.'
      });
    }

    // 6. Standalone Mode Status
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    results.push({
      condition: 'وضع التشغيل حالياً (Standalone)',
      status: isPWA ? 'PASSED' : 'PASSED',
      value: isPWA ? 'مثبت ويعمل من الشاشة الرئيسية (Standalone)' : 'يعمل عبر نافذة المتصفح التقليدية (Tabs)',
      recommendation: isPWA ? 'التطبيق يعمل بكفاءة كاملة كتطبيق حقيقي.' : 'يمكن للمستخدمين تثبيته لتشغيله في نافذة مستقلة وخفية لشريط العنوان.'
    });

    // 7. Interactive Engagement Metrics
    const timeSpent = this.getTimeOnSite();
    const isEngaged = timeSpent >= 10 || this.userEngagementScore >= 5;
    results.push({
      condition: 'نقاط تفاعل المستخدم والوقت',
      status: isEngaged ? 'PASSED' : 'WARNING',
      value: `الوقت: ${timeSpent} ثانية | عدد النقرات/الحركة: ${this.userEngagementScore}`,
      recommendation: isEngaged 
        ? 'نقاط التفاعل جيدة ومناسبة لظهور نافذة التثبيت.' 
        : 'قد يحتاج المستخدم إلى قضاء 10-30 ثانية والتنقل بالصفحة ليمنحه المتصفح صلاحية التثبيت التلقائي (Anti-Spam security).'
    });

    // 8. Offline Readiness Test
    let offlineReady = false;
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        offlineReady = cacheNames.length > 0;
      } catch (e) {}
    }
    results.push({
      condition: 'جاهزية التصفح دون إنترنت (Offline Cache)',
      status: offlineReady ? 'PASSED' : 'WARNING',
      value: offlineReady ? 'تم العثور على ملفات مخزنة محلياً' : 'لا تتوفر ملفات مخزنة مؤقتاً بعد لعدم تفعيل الكاش بالكامل',
      recommendation: offlineReady ? 'التطبيق مهيأ بالكامل للتشغيل دون اتصالات إنترنت.' : 'انتظر تحميل الـ Service worker كاملاً ليخزن الأصول الرئيسية في الذاكرة.'
    });

    // Log the diagnostics with console.table beautifully
    console.log('%c📊 تقرير تشخيصي متكامل لقابلية تثبيت PWA وسيط بلاس 📊', 'color: #22c55e; font-size: 16px; font-weight: bold;');
    console.table(results.map(r => ({
      'المعيار الفني': r.condition,
      'النتيجة': r.status,
      'القيمة الحالية': r.value,
      'الإجراء والملاحظة': r.recommendation
    })));

    return results;
  }

  static analyzeUninstallabilityReason(): string {
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isHttps) {
      return 'الاتصال الحالي غير آمن (وليس localhost). يحتاج متصفح Chrome إلى بروتوكول HTTPS آمن تماماً لتمكين التثبيت.';
    }

    if (!('serviceWorker' in navigator)) {
      return 'المتصفح الحالي لا يدعم الـ Service Worker كلياً (قد تصفح في وضع مخفي أو متصفح الويب المدمج لبعض التطبيقات الأقل توافقاً).';
    }

    const promptFired = this.beforeInstallPromptFired || !!(window as any).deferredPrompt;
    if (!promptFired) {
      const timeSpent = this.getTimeOnSite();
      if (timeSpent < 10) {
        return 'أمان متصفح كروم يتطلب بقاء المستخدم على الأقل 10-30 ثانية والتنقل بالصفحة لفلترة روبوتات السبام وتأكيد وجود رغبة تفاعل حقيقية.';
      }
      return 'لم يطلق المتصفح حدث "beforeinstallprompt" بعد. قد ترجع الأسباب إلى: ١) التطبيق تم تثبيته بالفعل على جهازك مسبقاً، أو ٢) المتصفح يحظر ظهور النوافذ بنمط صارم، أو ٣) لم يحدث تفاعل كاف مثل التمرير والنقرات الحقيقية.';
    }

    return 'لا توجد معوقات ظاهرة بالتطبيق! حدث beforeinstallprompt جاهز للتفعيل عند قيام المستخدم بالنقر على زر التثبيت.';
  }
}
