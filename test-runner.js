// Sprint 5 Test Runner - Execute in Browser Console
// Copy this script into the browser console at localhost:5174/pocketbiz-platform

(function runSprint5Tests() {
    console.log('🧪 Sprint 5 Quick Test Runner');

    // Helper function for delays
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function testBasicMeetingToPhase() {
        console.log('\n📝 Testing BasicMeetingToPhase...');

        if (!window.sprint5Tests?.scenarioTests?.basicMeetingToPhase) {
            console.log('❌ basicMeetingToPhase test not found');
            return false;
        }

        try {
            const result = await window.sprint5Tests.scenarioTests.basicMeetingToPhase();
            console.log(`✅ BasicMeetingToPhase: ${result ? 'PASSED' : 'FAILED'}`);
            return result;
        } catch (error) {
            console.log('❌ BasicMeetingToPhase error:', error.message);
            return false;
        }
    }

    async function testCalendarIntegration() {
        console.log('\n📅 Testing CalendarIntegration...');

        if (!window.sprint5Tests?.scenarioTests?.calendarIntegration) {
            console.log('❌ calendarIntegration test not found');
            return false;
        }

        try {
            const result = await window.sprint5Tests.scenarioTests.calendarIntegration();
            console.log(`✅ CalendarIntegration: ${result ? 'PASSED' : 'FAILED'}`);
            return result;
        } catch (error) {
            console.log('❌ CalendarIntegration error:', error.message);
            return false;
        }
    }

    async function debugContexts() {
        console.log('\n🔍 Context Debug Information:');

        console.log('ScheduleContext:', {
            exists: !!window.scheduleContext,
            schedules: window.scheduleContext?.schedules?.length || 0,
            createSchedule: typeof window.scheduleContext?.createSchedule
        });

        console.log('BuildupContext:', {
            exists: !!window.buildupContext,
            projects: window.buildupContext?.projects?.length || 0,
            executePhaseTransition: typeof window.buildupContext?.executePhaseTransition
        });

        // Filter buildup meetings
        const buildupMeetings = (window.scheduleContext?.schedules || []).filter(s =>
            s.type === 'buildup_project' || s.tags?.includes('buildup')
        );

        console.log('Buildup Meetings:', {
            total: buildupMeetings.length,
            testMeetings: buildupMeetings.filter(m =>
                m.title?.includes('[테스트]') ||
                m.title?.includes('[시나리오]') ||
                m.title?.includes('Sprint 5')
            ).length
        });

        return buildupMeetings.length > 0;
    }

    async function runQuickTest() {
        console.log('\n🚀 Running Quick Tests...');

        // Wait for contexts to load
        await delay(1000);

        const hasContexts = await debugContexts();

        if (!hasContexts) {
            console.log('\n⚠️  No buildup meetings found. Creating test meeting...');

            try {
                const testMeeting = await window.scheduleContext.createSchedule({
                    type: 'buildup_project',
                    title: '[Quick Test] Test Meeting',
                    description: 'Quick test meeting',
                    date: new Date(Date.now() + 60000),
                    startDateTime: new Date(Date.now() + 60000),
                    endDateTime: new Date(Date.now() + 120000),
                    projectId: 'PRJ-TEST',
                    meetingSequence: 'pre_meeting',
                    pmInfo: {
                        id: 'pm-quicktest-001',
                        name: 'Quick Test PM',
                        email: 'quicktest.pm@pocketcompany.co.kr'
                    }
                });

                console.log('✅ Test meeting created:', testMeeting.id);
                await delay(2000); // Wait for event processing
            } catch (error) {
                console.log('❌ Failed to create test meeting:', error.message);
            }
        }

        const basicResult = await testBasicMeetingToPhase();
        const calendarResult = await testCalendarIntegration();

        const passCount = (basicResult ? 1 : 0) + (calendarResult ? 1 : 0);
        const successRate = Math.round((passCount / 2) * 100);

        console.log(`\n📊 Test Summary:`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Passed: ${passCount}/2`);
        console.log(`BasicMeetingToPhase: ${basicResult ? '✅' : '❌'}`);
        console.log(`CalendarIntegration: ${calendarResult ? '✅' : '❌'}`);

        return { successRate, passCount, totalTests: 2 };
    }

    // Make functions available globally
    window.quickTestRunner = {
        runQuickTest,
        testBasicMeetingToPhase,
        testCalendarIntegration,
        debugContexts
    };

    console.log('\n💡 Available commands:');
    console.log('  quickTestRunner.runQuickTest() - Run all tests');
    console.log('  quickTestRunner.debugContexts() - Debug context info');
    console.log('  quickTestRunner.testBasicMeetingToPhase() - Test phase transition');
    console.log('  quickTestRunner.testCalendarIntegration() - Test calendar');

    console.log('\n🎯 Running tests automatically in 2 seconds...');
    setTimeout(runQuickTest, 2000);
})();