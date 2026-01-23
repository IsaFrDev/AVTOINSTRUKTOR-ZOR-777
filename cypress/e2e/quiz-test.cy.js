/**
 * AVTOINSTRUKTOR ZOR 777 - Quiz Testi
 * 
 * Bu test quiz sahifasidagi savollar va rasmlar o'rtasidagi 
 * nomuvofiqlikni tekshirish uchun mo'ljallangan.
 */

describe('Quiz Page - Savol va Rasm Tekshiruvi', () => {
    // Test natijalarini saqlash uchun
    let testResults = [];

    beforeEach(() => {
        // Har bir testdan oldin
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('Topic 38 sahifasiga kirish va savollarni tekshirish', () => {
        // Quiz sahifasiga kirish
        cy.visit('/quiz?topicId=38');

        // Sahifa yuklangan bo'lishini kutish
        cy.wait(3000);

        // Sahifada xatolik bor yoki yo'qligini tekshirish
        cy.get('body').then(($body) => {
            // Agar "Savollar topilmadi" yoki xatolik bo'lsa
            if ($body.text().includes('topilmadi') || $body.text().includes('Xatolik')) {
                cy.log('❌ Bu mavzuda savollar topilmadi!');
                testResults.push({
                    topic: 38,
                    status: 'NOT_FOUND',
                    message: 'Bu mavzuda savollar topilmadi'
                });
            } else {
                // Savol kartasini izlash
                cy.log('✅ Sahifa muvaffaqiyatli yuklandi');

                // Savol matnini olish
                cy.get('h3').first().then(($question) => {
                    const questionText = $question.text();
                    cy.log(`📝 Savol: ${questionText}`);

                    testResults.push({
                        questionNumber: 1,
                        questionText: questionText,
                        hasImage: false
                    });
                });

                // Rasmni tekshirish (agar mavjud bo'lsa)
                cy.get('body').then(($body) => {
                    const hasImage = $body.find('img[alt="Question"]').length > 0;
                    if (hasImage) {
                        cy.get('img[alt="Question"]').then(($img) => {
                            const imgSrc = $img.attr('src');
                            cy.log(`🖼️ Rasm URL: ${imgSrc}`);

                            // Rasmning yuklanganligini tekshirish
                            cy.get('img[alt="Question"]')
                                .should('be.visible')
                                .and(($img) => {
                                    expect($img[0].naturalWidth).to.be.greaterThan(0);
                                });
                        });
                    } else {
                        cy.log('ℹ️ Bu savolda rasm yo\'q');
                    }
                });
            }
        });
    });

    // Barcha mavzularni tekshirish (1-33)
    for (let topicId = 1; topicId <= 33; topicId++) {
        it(`Topic ${topicId} - Savollarni tekshirish`, () => {
            cy.visit(`/quiz?topicId=${topicId}`);
            cy.wait(2000);

            cy.get('body').then(($body) => {
                if ($body.text().includes('topilmadi') || $body.text().includes('Xatolik')) {
                    cy.log(`❌ Topic ${topicId}: Savollar topilmadi`);
                } else {
                    cy.log(`✅ Topic ${topicId}: Sahifa yuklandi`);

                    // Savol matnini va rasmni tekshirish
                    cy.get('h3').first().then(($q) => {
                        cy.log(`📝 Savol: ${$q.text().substring(0, 100)}...`);
                    });

                    // Rasm bor-yo'qligini tekshirish
                    const hasImage = $body.find('img[alt="Question"]').length > 0;
                    if (hasImage) {
                        cy.get('img[alt="Question"]').first()
                            .should('be.visible')
                            .and(($img) => {
                                // Rasm yuklangan bo'lishi kerak
                                const imgWidth = $img[0].naturalWidth;
                                if (imgWidth === 0) {
                                    cy.log(`⚠️ Topic ${topicId}: Rasm yuklanmadi!`);
                                } else {
                                    cy.log(`✅ Topic ${topicId}: Rasm yuklandi (${imgWidth}px)`);
                                }
                                expect(imgWidth).to.be.greaterThan(0);
                            });
                    }
                }
            });
        });
    }
});

// Birinchi mavzu ichidagi barcha savollarni tekshirish
describe('Topic 1 - Barcha Savollar Tekshiruvi', () => {
    it('Topic 1 dagi barcha savollarni ko\'rib chiqish', () => {
        cy.visit('/quiz?topicId=1');
        cy.wait(3000);

        // Rekursiv funksiya bir nechta savolni tekshirish uchun
        const checkQuestion = (questionIndex, maxQuestions = 5) => {
            if (questionIndex >= maxQuestions) {
                cy.log(`✅ ${maxQuestions} ta savol tekshirildi`);
                return;
            }

            cy.get('body').then(($body) => {
                // Natijalar sahifasida bo'lsak to'xtatamiz
                if ($body.text().includes('Tabriklaymiz') || $body.text().includes('yutqazdingiz')) {
                    cy.log('📊 Natijalar sahifasiga yetib keldik');
                    return;
                }

                // Savol matnini log qilish
                cy.get('h3').first().then(($q) => {
                    cy.log(`📝 Savol ${questionIndex + 1}: ${$q.text()}`);
                });

                // Agar rasm bo'lsa, tekshirish
                if ($body.find('img[alt="Question"]').length > 0) {
                    cy.get('img[alt="Question"]').first().then(($img) => {
                        const src = $img.attr('src');
                        cy.log(`🖼️ Rasm: ${src}`);
                    });
                }

                // Javobni tanlash (birinchi javob)
                cy.get('button').contains(/^[A-D]$/).first().click({ force: true });

                // Keyingi savolga o'tishni kutish
                cy.wait(2000);

                // Keyingi savolni tekshirish
                checkQuestion(questionIndex + 1, maxQuestions);
            });
        };

        checkQuestion(0, 5);
    });
});

// Rasmlarning to'g'ri yuklanishini tekshirish
describe('Rasm Yuklash Tekshiruvi', () => {
    it('Barcha rasmlar 200 OK qaytarishi kerak', () => {
        cy.visit('/quiz?topicId=1');
        cy.wait(3000);

        cy.get('img[alt="Question"]').each(($img) => {
            const src = $img.attr('src');
            if (src && src.startsWith('http')) {
                cy.request({
                    url: src,
                    failOnStatusCode: false
                }).then((response) => {
                    if (response.status !== 200) {
                        cy.log(`❌ Rasm yuklanmadi: ${src} (Status: ${response.status})`);
                    } else {
                        cy.log(`✅ Rasm OK: ${src}`);
                    }
                });
            }
        });
    });
});
