/**
 * Content for the three REGULATED legal documents.
 *
 * ⚠️  PLACEHOLDER ONLY — must be replaced with lawyer-reviewed text before launch.
 * Every section body is deliberately NOT binding legal wording. It carries a visible
 * «[ШАБЛОН …]» / «[TEMPLATE …]» marker followed by a plain-language note of what a lawyer
 * must put in that section. The section STRUCTURE (headings + coverage) is the value here;
 * the binding text must come from a qualified Turkish lawyer / a compliant template.
 *
 * Section structures were derived to match Turkish-law requirements:
 *   • Privacy — KVKK (Law No. 6698) Aydınlatma Metni, GDPR-friendly
 *   • Distance Selling Contract — Law No. 6502 + Mesafeli Sözleşmeler Yönetmeliği (required by iyzico)
 *   • Delivery & Returns — cancellation/refund policy (required by iyzico)
 */
import type { LegalDocContent } from '../components/LegalDocPage'

const TAG_RU = '[ШАБЛОН — заменить реальным юридическим текстом, проверенным юристом]'
const TAG_EN = '[TEMPLATE — replace with real, lawyer-reviewed legal text]'

/** One section defined once in both languages. */
interface Row {
  hRu: string
  hEn: string
  /** Plain-language note of what this section must cover (guidance to the lawyer — NOT binding text). */
  gRu: string
  gEn: string
}

function build(
  titleRu: string,
  titleEn: string,
  turkishTitle: string,
  introRu: string,
  introEn: string,
  rows: Row[],
): Record<'ru' | 'en', LegalDocContent> {
  return {
    ru: {
      title: titleRu,
      turkishTitle,
      intro: introRu,
      sections: rows.map((r) => ({ h: r.hRu, b: `${TAG_RU} Раздел должен содержать: ${r.gRu}` })),
    },
    en: {
      title: titleEn,
      turkishTitle,
      intro: introEn,
      sections: rows.map((r) => ({ h: r.hEn, b: `${TAG_EN} This section must set out: ${r.gEn}` })),
    },
  }
}

/* ================================================================== *
 * 1) PRIVACY POLICY — KVKK Aydınlatma Metni (GDPR-friendly)
 * ================================================================== */
export const privacyContent = build(
  'Политика конфиденциальности',
  'Privacy Policy',
  'Gizlilik Politikası ve KVKK Aydınlatma Metni',
  'Как AVENTA собирает, использует и защищает персональные данные клиентов в соответствии с KVKK (Закон № 6698) и GDPR.',
  "How AVENTA collects, uses and protects customers' personal data under the KVKK (Law No. 6698) and GDPR.",
  [
    { hRu: 'Введение и сфера применения', hEn: 'Introduction and Scope',
      gRu: 'назначение документа как уведомления по KVKK (Aydınlatma Metni) и GDPR, а также какие лица и услуги (сайт, бронирование, доставка) он охватывает.',
      gEn: 'the purpose of the document as a KVKK Aydınlatma Metni + GDPR notice, and which persons/services (website, booking, delivery) it covers.' },
    { hRu: 'Идентификация оператора данных (Veri Sorumlusu)', hEn: 'Identity of the Data Controller (Veri Sorumlusu)',
      gRu: 'полное юридическое наименование компании, номер MERSIS/налоговый номер, зарегистрированный адрес в Анталии, статус регистрации в VERBIS и контактные данные.',
      gEn: 'full legal company name, MERSIS/tax number, registered Antalya address, VERBIS registration status, and contact details.' },
    { hRu: 'Определения', hEn: 'Definitions',
      gRu: 'ключевые термины KVKK (kişisel veri, özel nitelikli veri, işleme, veri sorumlusu, veri işleyen, ilgili kişi, açık rıza), чтобы уведомление было самодостаточным.',
      gEn: 'the key KVKK terms used (kişisel veri, özel nitelikli veri, işleme, veri sorumlusu, veri işleyen, ilgili kişi, açık rıza) so the notice is self-contained.' },
    { hRu: 'Категории собираемых персональных данных', hEn: 'Categories of Personal Data Collected',
      gRu: 'все категории данных: паспорт/ID, водительское удостоверение (включая фото документов), контакты, данные о сделках, платёжные/карточные данные через iyzico, адрес доставки, данные об использовании авто и трафике, технические данные сайта.',
      gEn: 'every data category collected: identity/passport-ID, driver licence incl. document photos, contact, transaction, payment/card data via iyzico, delivery address, vehicle-use and traffic data, and website/technical data.' },
    { hRu: 'Особые категории данных', hEn: 'Special Categories of Personal Data',
      gRu: 'могут ли особые категории (özel nitelikli) данных появляться в сканах ID/ВУ, и какие дополнительные меры/согласие KVKK к ним применяются.',
      gEn: 'whether any özel nitelikli data appears in scanned ID/licence documents, and the additional KVKK safeguards/consent applied to it.' },
    { hRu: 'Цели обработки персональных данных', hEn: 'Purposes of Processing',
      gRu: 'каждую цель обработки: заключение и исполнение договора аренды, проверка личности/ВУ, обработка залога и платежей, доставка авто, юридические/налоговые обязанности, предотвращение мошенничества, коммуникации.',
      gEn: 'each processing purpose: rental contract conclusion/performance, identity/licence verification, deposit and payment handling, car delivery, legal/tax obligations, fraud prevention, and communications.' },
    { hRu: 'Правовые основания обработки (ст. 5 и 6 KVKK)', hEn: 'Legal Basis for Processing (KVKK Art. 5 & 6)',
      gRu: 'сопоставление каждой цели/категории данных с конкретным основанием по ст. 5 (и ст. 6 для особых данных) KVKK и указание, где используется явное согласие (açık rıza).',
      gEn: 'each purpose/data category mapped to a specific KVKK Art. 5 (and Art. 6 for special data) legal ground, and where explicit consent (açık rıza) is relied upon.' },
    { hRu: 'Способ и источник сбора данных', hEn: 'Method and Source of Data Collection',
      gRu: 'каналы сбора (формы сайта, бронирование, очно/при доставке, загруженные фото документов, платёжный шлюз) и поступают ли данные напрямую от лица или от третьих лиц.',
      gEn: 'the collection channels (website forms, booking, in-person/delivery, uploaded document photos, payment gateway) and whether data comes directly from the person or third parties.' },
    { hRu: 'Передача данных третьим лицам', hEn: 'Transfer of Data to Third Parties',
      gRu: 'категории получателей (iyzico/платёжный процессор, банки, страховщики, ИТ/хостинг, юристы, госорганы) с правовым основанием KVKK и целью каждой передачи.',
      gEn: 'recipient categories (iyzico/payment processor, banks, insurers, IT/hosting, lawyers, public authorities) with the KVKK legal basis and purpose for each transfer.' },
    { hRu: 'Международная передача данных (за рубеж)', hEn: 'International (Cross-Border) Data Transfers',
      gRu: 'передаются ли данные за рубеж, в какие страны/каким провайдерам, и на какую гарантию по ст. 9 KVKK это опирается (адекватность, обязательство или явное согласие).',
      gEn: 'whether data is transferred abroad, to which countries/providers, and the KVKK Art. 9 safeguard relied on (adequacy, undertaking, or explicit consent).' },
    { hRu: 'Место хранения и сроки хранения данных', hEn: 'Storage Location and Retention Periods',
      gRu: 'где хранятся данные и срок хранения по каждой категории со ссылкой на законные пределы (налоговое/торговое право) и удаление/анонимизацию по истечении срока.',
      gEn: 'where data is stored and the retention period per category, referencing statutory limits (tax/commercial law) and post-retention deletion/anonymisation.' },
    { hRu: 'Меры безопасности данных', hEn: 'Data Security Measures',
      gRu: 'технические и административные меры (шифрование, контроль доступа, PCI-DSS-обработка платежей, конфиденциальность сотрудников, процедуры при инцидентах) по ст. 12 KVKK.',
      gEn: 'the technical and administrative safeguards (encryption, access controls, PCI-DSS payment handling, staff confidentiality, breach procedures) required under KVKK Art. 12.' },
    { hRu: 'Автоматизированное принятие решений и профилирование', hEn: 'Automated Decision-Making and Profiling',
      gRu: 'принимаются ли решения (скоринг рисков/мошенничества, одобрение брони) исключительно автоматически, их логику и значимость, и право не быть объектом таких решений (ст. 11/ж KVKK, ст. 22 GDPR).',
      gEn: 'whether any decisions (fraud/risk scoring, booking approval) are made solely by automated processing, the logic/significance, and the right not to be subject to such decisions (KVKK Art. 11/g, GDPR Art. 22).' },
    { hRu: 'Видеонаблюдение и GPS/телематика автомобилей', hEn: 'CCTV and Vehicle GPS/Telematics Tracking',
      gRu: 'используются ли на авто/в помещениях GPS-телематика и видеонаблюдение, цель (защита от угона, лимиты использования, ДТП), правовое основание и срок хранения.',
      gEn: 'whether vehicles/premises use GPS/telematics and CCTV, the purpose (theft prevention, usage limits, accident handling), legal basis, and retention.' },
    { hRu: 'Данные третьих лиц (доп. водители, дети)', hEn: 'Third-Party Data (Additional Drivers, Minors)',
      gRu: 'сбор данных о лицах, отличных от клиента (доп. водители, сопровождающие дети), обязанность клиента их проинформировать и как реализуются их права по KVKK.',
      gEn: 'collection of data about persons other than the customer (additional drivers, accompanying minors), the customer’s duty to inform them, and how their KVKK rights are handled.' },
    { hRu: 'Права субъекта данных (ст. 11 KVKK)', hEn: 'Data Subject Rights (KVKK Art. 11)',
      gRu: 'все права по ст. 11 (узнать об обработке, запросить сведения и цель, узнать получателей, исправить, удалить/уничтожить, возразить, компенсация) и эквивалентные права GDPR.',
      gEn: 'all Art. 11 rights (learn if processed, request info & purpose, know recipients, correct, delete/destroy, object, compensation) plus equivalent GDPR rights.' },
    { hRu: 'Порядок реализации прав и обращение (Başvuru)', hEn: 'How to Exercise Rights / Application (Başvuru)',
      gRu: 'процедуру başvuru: каналы/адрес подачи (KEP, email, письменно), требуемые идентификационные данные, законный срок ответа и право жалобы в Kurul.',
      gEn: 'the başvuru procedure: application channels/address (KEP, email, written), required identifying details, the statutory response deadline, and the right to complain to the Kurul.' },
    { hRu: 'Файлы cookie и технологии отслеживания', hEn: 'Cookies and Tracking Technologies',
      gRu: 'категории используемых cookie, их цели, механизм согласия и как пользователь может управлять ими или отказаться (или ссылку на отдельную Cookie-политику).',
      gEn: 'the cookie categories used, their purposes, the consent mechanism, and how the user can manage or refuse them (or a link to a separate Cookie Policy).' },
    { hRu: 'Согласие (Açık Rıza)', hEn: 'Consent (Açık Rıza)',
      gRu: 'где требуется явное согласие, как оно получается и что оно может быть отозвано в любой момент с указанием последствий отзыва.',
      gEn: 'where explicit consent is required, how it is obtained, and that it can be withdrawn at any time with the effect of withdrawal.' },
    { hRu: 'Изменения в политике конфиденциальности', hEn: 'Changes to This Privacy Policy',
      gRu: 'что политика может обновляться, как уведомляются пользователи, и дату вступления в силу / последнего обновления и версию.',
      gEn: 'that the policy may be updated, how users are notified, and the effective/last-updated date and version.' },
    { hRu: 'Контактная информация', hEn: 'Contact Information',
      gRu: 'контакты оператора по вопросам конфиденциальности: ответственное лицо/email, почтовый (Анталия) адрес, KEP-адрес и телефон.',
      gEn: "the controller’s contact points for privacy questions: responsible contact/email, postal (Antalya) address, KEP address, and phone." },
  ],
)

/* ================================================================== *
 * 2) DISTANCE SELLING CONTRACT — Mesafeli Satış Sözleşmesi
 * ================================================================== */
export const distanceSellingContent = build(
  'Договор оферты (дистанционной продажи)',
  'Distance Selling Contract',
  'Mesafeli Satış Sözleşmesi',
  'Договор дистанционной продажи услуги аренды, заключаемый при онлайн-бронировании, согласно Закону № 6502 и Положению о дистанционных договорах.',
  'The distance contract for the rental service, concluded on online booking, under Law No. 6502 and the Distance Contracts Regulation.',
  [
    { hRu: 'Предмет договора', hEn: 'Subject of the Contract',
      gRu: 'что договор регулирует онлайн-бронирование и аренду автомобиля и заключается согласно Закону о защите потребителей № 6502 и Положению о дистанционных договорах (Mesafeli Sözleşmeler Yönetmeliği).',
      gEn: 'that the contract governs the online (distance) booking and rental of a vehicle under Consumer Protection Law No. 6502 and the Distance Contracts Regulation.' },
    { hRu: 'Определения', hEn: 'Definitions',
      gRu: 'ключевые термины (Alıcı/потребитель, Satıcı-Sağlayıcı/продавец-поставщик, услуга/автомобиль, дистанционный договор, Положение, Министерство, постоянный носитель данных, залог).',
      gEn: 'the key terms (Alıcı/Consumer, Satıcı-Sağlayıcı/Seller-Provider, service/vehicle, distance contract, Regulation, Ministry, durable medium, deposit).' },
    { hRu: 'Стороны договора (Продавец/Поставщик и Покупатель)', hEn: 'Parties (Seller/Provider and Buyer)',
      gRu: 'полные идентификационные данные Продавца/Поставщика (наименование, MERSIS/налоговый №, адрес, телефон, email, KEP) и Покупателя (имя, адрес, телефон, email из брони).',
      gEn: 'full identifying details of the Seller/Provider (name, MERSIS/tax no., address, phone, email, KEP) and the Buyer (name, address, phone, email from the booking).' },
    { hRu: 'Предварительная информационная форма (Ön Bilgilendirme Formu)', hEn: 'Pre-Contractual Information Form (Ön Bilgilendirme Formu)',
      gRu: 'ссылку на обязательную отдельную форму Ön Bilgilendirme Formu (ст. 5 Положения) и подтверждение, что потребитель получил и одобрил всю предварительную информацию на постоянном носителе до заказа.',
      gEn: 'a reference to the mandatory separate Ön Bilgilendirme Formu (Reg. Art. 5) and confirmation the consumer received and approved all preliminary information on a durable medium before ordering.' },
    { hRu: 'Характеристики услуги и автомобиля, срок аренды', hEn: 'Characteristics of the Service/Vehicle and Rental Period',
      gRu: 'существенные качества авто (марка/модель/класс, номер или гарантия класса), даты/время начала и конца аренды, места выдачи/возврата, пробег/топливо/страхование и доп. опции.',
      gEn: 'essential vehicle qualities (make/model/class, plate or class guarantee), rental start/end date-times, pickup/drop-off locations, mileage/fuel/insurance and add-ons.' },
    { hRu: 'Общая цена с учётом налогов и всех расходов', hEn: 'Total Price Including Taxes and All Costs',
      gRu: 'детализированную общую цену аренды с НДС/налогами, всеми обязательными сборами, стоимостью доставки и доп. услуг — как валовую итоговую сумму в валюте операции.',
      gEn: 'the itemized total price incl. VAT/taxes, all mandatory fees, delivery charges and additional services, as a gross all-inclusive figure in the transaction currency.' },
    { hRu: 'Условия и способ оплаты (карта через iyzico)', hEn: 'Payment Terms and Method (Card via iyzico)',
      gRu: 'способ оплаты (карта через шлюз iyzico), момент списания, замечания по рассрочке/валюте и что карточные данные обрабатывает лицензированный провайдер, а не Продавец.',
      gEn: 'the payment method (card via the iyzico gateway), timing of charge, installment/currency notes, and that card data is handled by the licensed provider, not the Seller.' },
    { hRu: 'Условия, место и стоимость доставки / передачи автомобиля', hEn: 'Delivery / Vehicle Handover Terms, Place and Costs',
      gRu: 'как и где авто доставляется/передаётся (офис, аэропорт, отель/адрес), кто несёт расходы на доставку, требуемые при передаче документы (паспорт/ID + ВУ) и порядок передачи/осмотра.',
      gEn: 'how and where the vehicle is delivered/handed over (office, airport, hotel/address), who bears delivery costs, required documents at handover (passport/ID + licence), and the handover/inspection procedure.' },
    { hRu: 'Срок исполнения обязательства', hEn: 'Performance Period',
      gRu: 'период, в течение которого услуга (предоставление авто) исполняется, максимальный законный срок исполнения и последствия невозможности предоставления.',
      gEn: 'the period within which the service (vehicle provision) is performed, the maximum statutory performance deadline, and consequences if it cannot be provided.' },
    { hRu: 'Право на отказ (Cayma Hakkı) и исключения', hEn: 'Right of Withdrawal (Cayma Hakkı) and Exceptions',
      gRu: 'общее 14-дневное право на отказ и порядок его реализации, затем чёткую ссылку на исключения Положения — в частности, что аренда авто на конкретные даты обычно исключена из права на отказ.',
      gEn: 'the general 14-day withdrawal right and how to exercise it, then a clear invocation of the Regulation’s exceptions — notably that vehicle rental for specific dates is typically exempt from withdrawal.' },
    { hRu: 'Условия отмены бронирования и неявки (no-show)', hEn: 'Cancellation and No-Show Terms',
      gRu: 'окна отмены, любые сборы или возвраты по срокам и последствия неявки клиента за автомобилем — согласованно с исключением из права на отказ.',
      gEn: 'cancellation windows, any fees or refunds by timeframe, and the consequences of a no-show, consistent with the withdrawal exception.' },
    { hRu: 'Депозит: внесение, удержание и возврат', hEn: 'Deposit: Blocking, Deduction and Refund',
      gRu: 'как берётся залог (блокировка/авторизация на карте), против чего может применяться (ущерб, топливо, штрафы, платные дороги) и срок и способ его возврата/разблокировки.',
      gEn: 'how the deposit is taken (card block/authorization), what it may be applied against (damage, fuel, fines, tolls), and the timeline and method for releasing it.' },
    { hRu: 'Обязанности сторон', hEn: 'Obligations of the Parties',
      gRu: 'обязанности Продавца (исправное авто, документы, соблюдение брони) и Покупателя (право/возраст/ВУ, законное использование, состояние при возврате, своевременная оплата).',
      gEn: 'the duties of the Seller (roadworthy vehicle, documents, honour the booking) and the Buyer (eligibility/age/licence, lawful use, return condition, timely payment).' },
    { hRu: 'Просрочка и неисполнение (default)', hEn: 'Default and Late Performance',
      gRu: 'последствия неисполнения любой из сторон, сборы за поздний возврат, средства правовой защиты и права потребителя, если услуга не оказана в законный срок.',
      gEn: 'the consequences of default by either party, late-return charges, remedies, and the consumer’s rights if the service is not performed within the statutory period.' },
    { hRu: 'Персональные данные и KVKK', hEn: 'Personal Data and KVKK',
      gRu: 'что персональные данные (включая фото паспорта/ID и ВУ) обрабатываются по Закону № 6698 (KVKK), со ссылкой на отдельное уведомление (Aydınlatma) и тексты явного согласия.',
      gEn: 'that personal data (incl. passport/ID and licence photos) is processed under Law No. 6698 (KVKK), with a reference to the separate Aydınlatma notice and explicit-consent texts.' },
    { hRu: 'Разрешение споров (Арбитражная комиссия / Потребительский суд, ODR)', hEn: 'Dispute Resolution (Consumer Arbitration Committee / Consumer Court, ODR)',
      gRu: 'компетентные органы — Tüketici Hakem Heyeti до годового денежного порога и Tüketici Mahkemesi выше него — с подсудностью и упоминанием онлайн-урегулирования споров (ODR).',
      gEn: 'the competent forums — Tüketici Hakem Heyeti up to the annual threshold and Tüketici Mahkemesi above it — with jurisdiction and a reference to online dispute resolution (ODR).' },
    { hRu: 'Применимое право, язык договора и подсудность', hEn: 'Governing Law, Contract Language and Jurisdiction',
      gRu: 'применимое право (турецкое), преобладающий язык договора при многоязычии (RU/EN vs. турецкий оригинал) и применимую подсудность.',
      gEn: 'the governing law (Turkish law), the prevailing language if multilingual (RU/EN vs. the Turkish original), and the applicable jurisdiction.' },
    { hRu: 'Порядок подачи жалоб и обращений (каналы продавца)', hEn: 'Complaint and Application Channels (Seller’s Mechanism)',
      gRu: 'как потребитель может подать жалобы/претензии напрямую Продавцу (каналы, контакты, ожидаемая обработка) — отдельно и в дополнение к Hakem Heyeti/суду.',
      gEn: 'how the consumer can submit complaints/claims directly to the Seller (channels, contacts, expected handling), separate from and in addition to the Hakem Heyeti/Court.' },
    { hRu: 'Доказательственная сила записей', hEn: 'Evidentiary Records',
      gRu: 'что электронные записи, логи и переписка Продавца являются надлежащим доказательством в спорах согласно принципам доказательственного соглашения HMK.',
      gEn: 'that the Seller’s electronic records, logs and correspondence constitute conclusive evidence in disputes, per HMK evidentiary-agreement principles.' },
    { hRu: 'Форс-мажор', hEn: 'Force Majeure',
      gRu: 'определение событий форс-мажора и их влияние на исполнение, приостановление и расторжение договора без ответственности.',
      gEn: 'the definition of force majeure events and their effect on performance, suspension and cancellation of the contract without liability.' },
    { hRu: 'Вступление в силу и подтверждение', hEn: 'Effectiveness and Confirmation',
      gRu: 'подтверждение, что потребитель прочитал и электронно принял форму предварительной информации и настоящий договор, количество статей, дату акцепта и вступление в силу с момента подтверждения.',
      gEn: 'confirmation the consumer read and electronically accepted the pre-contract information form and this contract, the number of articles, the acceptance date, and entry into force upon confirmation.' },
  ],
)

/* ================================================================== *
 * 3) DELIVERY & RETURNS / CANCELLATION POLICY — Teslimat ve İade
 * ================================================================== */
export const deliveryReturnsContent = build(
  'Политика доставки и возврата',
  'Delivery & Returns Policy',
  'Teslimat ve İade Koşulları',
  'Условия доставки автомобиля, возврата, отмены бронирования и возврата денежных средств.',
  'Terms for vehicle delivery, returns, booking cancellation and refunds.',
  [
    { hRu: 'Общие положения и сфера применения', hEn: 'Introduction & Scope',
      gRu: 'что политика регулирует передачу авто, возвраты, отмены и возврат средств; что она читается вместе с договором аренды и Условиями сайта; версию и дату вступления в силу.',
      gEn: 'that this policy governs handover, returns, cancellations and refunds; that it is read with the rental agreement and site Terms; and the version and effective date.' },
    { hRu: 'Реквизиты компании (продавца/поставщика услуг)', hEn: 'Company / Service Provider Details',
      gRu: 'юридическое наименование, торговое название, полный адрес в Анталии, налоговый/регистрационный (MERSIS) номер, телефон, email и сайт — идентификация продавца, требуемая iyzico на каждой странице политики.',
      gEn: 'legal name, trade name, full Antalya address, tax/registration (MERSIS) number, phone, email and website — the seller identity iyzico requires on every policy page.' },
    { hRu: 'Определения', hEn: 'Definitions',
      gRu: 'ключевые термины политики: арендатор/клиент, автомобиль, срок аренды, доставка, передача/возврат, залог, блокировка, неявка, форс-мажор, рабочий день.',
      gEn: 'the key terms: renter/customer, vehicle, rental period, delivery, handover/return, deposit, security hold, no-show, force majeure, business day.' },
    { hRu: 'Описание услуги и предмет договора', hEn: 'Service Description & Subject of the Contract',
      gRu: 'что платная услуга — это срочная аренда (пользование) автомобиля, а не продажа товара, и что «доставка» означает передачу авто на срок аренды — основа для применения правил отказа/возврата.',
      gEn: 'that the paid service is the time-limited rental (use) of a vehicle, not a sale of goods, and that "delivery" means handover for the rental period — the basis for how withdrawal/return rules apply.' },
    { hRu: 'Способы и место доставки / передачи автомобиля', hEn: 'Delivery / Handover: Methods & Locations',
      gRu: 'где и как авто доставляется/передаётся (аэропорт Анталии, адрес/отель клиента, офис компании) и условия каждого варианта.',
      gEn: 'where and how the vehicle is delivered/handed over (Antalya airport, customer address/hotel, company office) and the conditions of each option.' },
    { hRu: 'Стоимость доставки', hEn: 'Delivery Costs / Fees',
      gRu: 'бесплатна ли доставка или платная, как рассчитываются сборы (по зоне/расстоянию/времени) и что сборы показываются клиенту до оплаты.',
      gEn: 'whether delivery is free or paid, how fees are calculated (by zone/distance/time), and that fees are shown to the customer before payment.' },
    { hRu: 'Сроки доставки и время передачи', hEn: 'Delivery Timing & Handover Time',
      gRu: 'когда авто становится доступным относительно забронированного времени начала, требования по заблаговременному уведомлению, внерабочее время и что происходит при задержках.',
      gEn: 'when the vehicle is available relative to the booked start time, any advance-notice requirement, out-of-hours arrangements, and what happens on delays.' },
    { hRu: 'Порядок передачи автомобиля и осмотр при выдаче', hEn: 'Handover Procedure & Inspection at Delivery',
      gRu: 'процесс передачи/осмотра (проверка состояния/топлива/пробега, акт о повреждениях, требуемые документы — ID/паспорт и ВУ, подписание акта передачи).',
      gEn: 'the handover/inspection process (condition/fuel/mileage check, damage report, required documents such as ID/passport and licence, signing the handover form).' },
    { hRu: 'Возврат автомобиля (место, время, порядок)', hEn: 'Vehicle Return (Where, When, How)',
      gRu: 'место/варианты возврата, требуемые дату-время возврата и льготный период, условия по топливу/чистоте/пробегу и процедуру осмотра при возврате — уточняя, что «возврат» здесь прежде всего означает возврат самого авто.',
      gEn: 'the return location/options, required return date-time and grace period, fuel/cleanliness/mileage conditions, and the return-inspection procedure — clarifying that "return" here first means returning the physical vehicle.' },
    { hRu: 'Право на отказ (отмену) и его исключения', hEn: 'Right of Withdrawal / Cancellation & Exceptions',
      gRu: 'ссылку на право потребителя на отказ по применимым турецким правилам дистанционных продаж и соответствующие исключения/ограничения для услуг аренды на конкретные даты (юрист вставляет точное правовое основание и изъятия).',
      gEn: 'a reference to the consumer right of withdrawal under applicable Turkish distance-sales rules and the relevant exceptions/limits for time-specific rental services (lawyer to insert the correct basis and carve-outs).' },
    { hRu: 'Условия отмены бронирования, сроки и сборы', hEn: 'Cancellation Terms, Deadlines & Fees',
      gRu: 'уровни отмены по сроку уведомления (напр. окно бесплатной отмены vs. поздняя отмена), любые сборы за отмену/администрирование и как подать запрос на отмену.',
      gEn: 'the cancellation tiers by notice period (e.g. free-cancellation window vs. later cancellation), any cancellation/admin fees, and how to submit a cancellation request.' },
    { hRu: 'Изменение бронирования', hEn: 'Booking Modifications / Amendments',
      gRu: 'как клиенты могут изменить даты, авто или детали доставки, любые разницы в цене или сборы за изменение и как это связано с правилами отмены и возврата.',
      gEn: 'how customers may change dates, vehicle or delivery details, any price differences or amendment fees, and how these interact with cancellation and refund rules.' },
    { hRu: 'Депозит: удержание, использование и возврат', hEn: 'Deposit / Security Hold: Placement, Use & Release',
      gRu: 'как берётся залог (пред-авторизация/блокировка vs. списание) и на какой основе сумма, что он покрывает, допустимые удержания (ущерб, недостающее топливо, штрафы/пошлины, уборка, поздний возврат) и срок и способ возврата остатка.',
      gEn: 'how the deposit is taken (pre-authorisation/hold vs. charge) and the amount basis, what it covers, permitted deductions (damage, missing fuel, fines/tolls, cleaning, late return), and the timeline and method for releasing the balance.' },
    { hRu: 'Способ и сроки возврата денежных средств', hEn: 'Refund Method & Timeline',
      gRu: 'что подлежащие возврату средства возвращаются на ту же карту/способ оплаты через iyzico, валюту, срок обработки и что сроки зачисления банком могут различаться — ключевой пункт возврата, который проверяет iyzico.',
      gEn: 'that eligible refunds are made back to the same card/method via iyzico, the currency, the processing timeframe, and that bank posting times may vary — the core refund clause iyzico checks.' },
    { hRu: 'Валюта, комиссии и конвертация', hEn: 'Currency, Charges & Conversion',
      gRu: 'валюту списания/возврата, что возвраты выполняются в исходной валюте списания, и что конвертация или банковские комиссии вне контроля компании.',
      gEn: 'the billing/refund currency, that refunds are issued in the original charge currency, and that FX conversion or bank charges are outside the company’s control.' },
    { hRu: 'Неявка (No-show) и поздний возврат', hEn: 'No-show & Late Return Handling',
      gRu: 'определение неявки и позднего возврата, сборы и последствия для возврата средств по каждому, льготный период и момент, когда бронь считается утраченной или начисляется доп. день.',
      gEn: 'the definition of no-show and late return, the fees and refund consequences for each, the grace period, and when a booking is forfeited or an extra day is charged.' },
    { hRu: 'Досрочный возврат и сокращение срока аренды', hEn: 'Early Return / Shortened Rental',
      gRu: 'даёт ли досрочный возврат право на возврат средств за неиспользованные дни и на каких условиях, включая любые невозвратные компоненты.',
      gEn: 'whether early return entitles the customer to a refund of unused days and on what conditions, including any non-refundable components.' },
    { hRu: 'Форс-мажор', hEn: 'Force Majeure',
      gRu: 'как чрезвычайные события вне контроля сторон влияют на обязательства по доставке, отмене и возврату и как такие ситуации разрешаются.',
      gEn: 'how extraordinary events beyond either party’s control affect delivery, cancellation and refund obligations, and how such situations are handled.' },
    { hRu: 'Персональные данные, платёжные данные и KVKK', hEn: 'Personal Data, Payment Data and KVKK',
      gRu: 'что персональные и платёжные данные для доставки/возвратов (включая обработку карт через iyzico и ID/ВУ при передаче) обрабатываются по KVKK № 6698, что карточные данные обрабатывает лицензированный провайдер, со ссылкой на отдельную Политику конфиденциальности.',
      gEn: 'that personal and payment data for delivery/returns (incl. card handling via iyzico and ID/licence at handover) is processed under KVKK Law No. 6698, that card data is handled by the licensed provider, and a cross-reference to the separate Privacy Policy.' },
    { hRu: 'Порядок подачи запросов, претензий и жалоб', hEn: 'How to Submit Requests, Claims & Complaints',
      gRu: 'канал и требуемую информацию для запросов на отмену/возврат и жалоб, ожидаемое время ответа и ссылку на органы потребительского арбитража (юрист вставляет правильный турецкий орган).',
      gEn: 'the channel and required information for cancellation/refund requests and complaints, the expected response time, and a reference to consumer arbitration bodies (lawyer to insert the correct authority).' },
    { hRu: 'Контактная информация', hEn: 'Contact Information',
      gRu: 'выделенные контакты по вопросам доставки, возврата, отмены и возврата средств — email, телефон, адрес и часы поддержки.',
      gEn: 'the dedicated contact channels for delivery, return, cancellation and refund matters — email, phone, address and support hours.' },
    { hRu: 'Применимое право, изменения и дата вступления в силу', hEn: 'Governing Law, Changes & Effective Date',
      gRu: 'применимое право и подсудность (Турция/Анталия), что политика может обновляться с уведомлением, номер версии и дату вступления в силу; приоритет относительно договора аренды.',
      gEn: 'the governing law and jurisdiction (Türkiye/Antalya), that the policy may be updated with notice, the version number and effective date, and its precedence relative to the rental agreement.' },
  ],
)
