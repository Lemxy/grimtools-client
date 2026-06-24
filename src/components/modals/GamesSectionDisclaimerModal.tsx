import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/AppContext';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const GamesSectionDisclaimerModal = memo(({ visible, onAccept, onDecline }: Props) => {
  const { t, accent } = useTheme();

  const sections = [
    {
      num: '1', title: 'Статус ПО',
      body: 'Программное обеспечение предоставляется исключительно в ознакомительных и исследовательских целях как инструмент автоматизации рутинных операций по настройке параметров запуска и структуры локальных данных. Автор не преследует целей нарушения авторских прав или оказания содействия в несанкционированном доступе к сервисам третьих лиц.',
    },
    {
      num: '2', title: 'Технический характер процессов',
      body: 'В процессе функционирования ПО производит автоматизированную коррекцию локальных метаданных и манифестов, что является стандартным методом оптимизации работы игровых клиентов в специфических конфигурациях ОС. Пользователь осознает, что любые модификации локальных библиотек осуществляются им самостоятельно и на свой риск.',
    },
    {
      num: '3', title: 'Отказ от гарантий',
      body: 'Программное обеспечение предоставляется по принципу «КАК ЕСТЬ». Автор не несет ответственности за возможные несовместимости с обновлениями сторонних игровых платформ, изменения в политиках безопасности третьих лиц, а также за любые потенциальные ограничения функционала игровых аккаунтов, которые могут возникнуть в результате изменения конфигурации системы пользователем.',
    },
    {
      num: '4', title: 'Разграничение ответственности',
      body: 'Использование данного инструмента является осознанным выбором пользователя. Автор снимает с себя ответственность за любые прямые или косвенные убытки, возникшие вследствие использования ПО, включая, но не ограничиваясь, потерю доступа к игровому контенту или сбои в работе системных компонентов.',
    },
    {
      num: '5', title: 'Конфиденциальность и права',
      body: 'Данный проект является независимой разработкой и не связан с какими-либо игровыми издателями или дистрибьюторами. Пользователь обязуется использовать инструмент исключительно в рамках личного некоммерческого пространства.',
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(8,8,10,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            style={{
              background: '#111114',
              border: '1px solid #23232b',
              width: '540px', maxWidth: '95vw',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '88vh',
            }}
          >
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #23232b', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accent.primary}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  📄
                </div>
                <div>
                  <h2 style={{ color: '#f4f4f5', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                    {t.gamesSectionDisclaimerTitle}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>
                    {t.gamesSectionDisclaimerSubtitle}
                  </p>
                </div>
              </div>

              <div style={{
                background: `${accent.primary}10`,
                borderRadius: '10px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent.primary, flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: accent.primary, margin: 0, fontWeight: 600 }}>
                  Настоящее ПО является специализированным инструментом для управления локальными конфигурационными файлами
                </p>
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '18px 26px', flex: 1 }}>
              {sections.map(s => (
                <div key={s.num} style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{
                    flexShrink: 0, width: '22px', height: '22px',
                    borderRadius: '7px', background: `${accent.primary}1a`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: accent.primary, fontWeight: 700,
                    marginTop: '1px',
                  }}>
                    {s.num}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#f4f4f5', margin: '0 0 4px', fontWeight: 600 }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: '1.65' }}>
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}

              <div style={{
                background: '#15151a',
                border: '1px solid #23232b',
                borderRadius: '10px', padding: '14px 16px', marginTop: '6px',
              }}>
                <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: '1.65' }}>
                  Нажимая кнопку <span style={{ color: '#f4f4f5', fontWeight: 600 }}>«Принять»</span>, вы подтверждаете, что полностью осознаёте технический характер производимых программой операций, добровольно берёте на себя все сопутствующие риски и не имеете претензий к автору проекта.
                </p>
              </div>
            </div>

            <div style={{ padding: '18px 26px', borderTop: '1px solid #23232b', display: 'flex', gap: '10px', flexShrink: 0 }}>
              <motion.button whileTap={{ scale: 0.98 }} onClick={onAccept}
                style={{ flex: 1, background: accent.primary, border: 'none', color: '#fff', fontSize: '13px', padding: '13px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
                {t.gamesSectionDisclaimerAccept}
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={onDecline}
                style={{ background: '#1a1a20', border: '1px solid #27272f', color: '#a1a1aa', fontSize: '12px', padding: '13px 18px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
                {t.gamesSectionDisclaimerDecline}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
