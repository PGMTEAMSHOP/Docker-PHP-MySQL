local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    warn("OSX: Local file not found or failed to load, loading from GitHub...")
    local githubSuccess, githubOSX = pcall(function()
        return loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
    end)
    if githubSuccess and githubOSX then
        OSX = githubOSX
    else
        error("OSX: Failed to load library from both local file and GitHub!")
    end
end

-- ========================================================
-- SERVICES & DATABASE LOADERS FOR BUTTERFLY LEGENDS
-- ========================================================
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local VIM = game:GetService("VirtualInputManager")
local LocalPlayer = Players.LocalPlayer

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Net = require(Shared:WaitForChild("Net"))
local CaseDatabase = require(Shared:WaitForChild("CaseDatabase"))
local Compact = require(Shared:WaitForChild("Compact"))

-- พิกัด CFrame สำหรับเทเลพอร์ต
local TP_CFRAME = CFrame.new(
    2103.62915, 59.9201317, 195.315628, 
    0.944769621, -4.51293189e-08, -0.327735215, 
    6.54804424e-08, 1, 5.10613809e-08, 
    0.327735215, -6.97014855e-08, 0.944769621
)

-- Global variables & configurations for loops
local Config = {
    AutoClicker = {
        Enabled = false,
        Delay = 0.1
    },
    AutoCrit = {
        Enabled = false,
        Delay = 0.1
    },
    AutoRebirth = {
        Enabled = false,
        Delay = 1.0
    },
    AutoOpenPopups = false,
    AutoOpenCase = {
        Enabled = false,
        SelectedId = nil
    }
}

-- Create Window
local Window = OSX:CreateWindow({
    Title = "OSX HUB | BUTTERFLY LEGENDS",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- ========================================================
-- TAB 1: INFO
-- ========================================================
local Tab1 = Window:AddTab({ Title = "Info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = Tab1:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer Main", "0b1100001cat")
DevPanel:AddInfoLabel("Developer Support", "LilYouDev1997x")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- ========================================================
-- TAB 2: MAIN HACKS (Auto Farms & Openers)
-- ========================================================
local Tab2 = Window:AddTab({ Title = "Main", Icon = "home", SubDescription = "Auto Farms & Utils" })

-- Panel: Auto Clicker & Auto Crit
local ClickerPanel = Tab2:AddPanel("Auto Clicker / Crit")

ClickerPanel:AddToggle({
    Title = "Auto Clicker",
    Description = "สแปมคลิกอัตโนมัติผ่าน Remote Event",
    Default = false,
    Callback = function(v) Config.AutoClicker.Enabled = v end
})

ClickerPanel:AddSlider({
    Title = "Click Delay",
    Description = "ความเร็วดีเลย์ในการสแปมคลิก (วินาที)",
    Min = 0.01,
    Max = 2.0,
    Default = 0.1,
    Rounding = 2,
    Callback = function(v) Config.AutoClicker.Delay = v end
})

ClickerPanel:AddToggle({
    Title = "Auto Crit",
    Description = "คลิกปุ่มคริติคอลบนหน้าจออัตโนมัติ",
    Default = false,
    Callback = function(v) Config.AutoCrit.Enabled = v end
})

ClickerPanel:AddSlider({
    Title = "Crit Delay",
    Description = "ความเร็วดีเลย์ในการกดปุ่มคริ (วินาที)",
    Min = 0.01,
    Max = 2.0,
    Default = 0.1,
    Rounding = 2,
    Callback = function(v) Config.AutoCrit.Delay = v end
})

-- Panel: Auto Rebirth & Popups
local RebirthPanel = Tab2:AddPanel("Auto Rebirth Settings")

RebirthPanel:AddToggle({
    Title = "Auto Rebirth",
    Description = "รีเบิร์ทอัตโนมัติเมื่อค่าพลังถึงเกณฑ์",
    Default = false,
    Callback = function(v) Config.AutoRebirth.Enabled = v end
})

RebirthPanel:AddSlider({
    Title = "Rebirth Delay",
    Description = "ดีเลย์ในการกดรีเบิร์ท (วินาที)",
    Min = 0.1,
    Max = 5.0,
    Default = 1.0,
    Rounding = 1,
    Callback = function(v) Config.AutoRebirth.Delay = v end
})

RebirthPanel:AddToggle({
    Title = "Auto Open Popups",
    Description = "ตรวจจับและกดเปิด/ปิดหน้าต่างของขวัญและกล่องหลังเกิดทันที",
    Default = false,
    Callback = function(v) Config.AutoOpenPopups = v end
})

-- Panel: Teleport Utility
local TeleportPanel = Tab2:AddPanel("Teleport Utils")

TeleportPanel:AddButton({
    Title = "Teleport to VIP Zone (Bypass Barrier)",
    Description = "ปิด CanCollide สิ่งกีดขวางแล้วเทเลพอร์ตไปจุด VIP Zone",
    Callback = function()
        pcall(function()
            local level4 = workspace:FindFirstChild("Level 4")
            local panteon = level4 and level4:FindFirstChild("panteon")
            local barrier = panteon and panteon:FindFirstChild("Barrier")
            if barrier and barrier:IsA("BasePart") then
                barrier.CanCollide = false
            end
        end)
        local char = LocalPlayer.Character
        if char then
            local hrp = char:FindFirstChild("HumanoidRootPart")
            if hrp then
                hrp.CFrame = TP_CFRAME
            end
        end
    end
})

-- ========================================================
-- TAB 3: CASES (Auto Open Cases)
-- ========================================================
local Tab3 = Window:AddTab({ Title = "Cases", Icon = "star", SubDescription = "Auto Open Box" })
local CasesPanel = Tab3:AddPanel("Auto Case Opener")

-- สร้างรายชื่อกล่องสุ่มที่มีในฐานข้อมูลเกม
local caseIds = CaseDatabase.OrderedIds
local caseOptions = {}
local caseMapping = {}

for _, caseId in ipairs(caseIds) do
    local caseData = CaseDatabase.get(caseId)
    if caseData then
        local priceText = ""
        if caseData.Price and caseData.Price > 0 then
            priceText = Compact.Format(caseData.Price) .. " Gems"
        elseif caseData.RobuxPrice and caseData.RobuxPrice > 0 then
            priceText = "R$ " .. tostring(caseData.RobuxPrice)
        else
            priceText = "Free"
        end
        local label = caseData.Name .. " (" .. priceText .. ")"
        table.insert(caseOptions, label)
        caseMapping[label] = caseId
    end
end

CasesPanel:AddDropdown({
    Title = "Select Case to Open",
    Description = "เลือกกล่องสุ่มที่คุณต้องการซื้อสปินสแปม",
    Values = caseOptions,
    Default = 1,
    Callback = function(SelectedLabel)
        Config.AutoOpenCase.SelectedId = caseMapping[SelectedLabel]
    end
})

CasesPanel:AddToggle({
    Title = "Auto Open Selected Case",
    Description = "ซื้อและเปิดกล่องสุ่มที่เลือกแบบอัตโนมัติ (ดีเลย์ 0.5 วินาที)",
    Default = false,
    Callback = function(v) Config.AutoOpenCase.Enabled = v end
})

-- Set default selected case on UI build if exists
if #caseOptions > 0 then
    Config.AutoOpenCase.SelectedId = caseMapping[caseOptions[1]]
end

-- ========================================================
-- BACKGROUND PROCESS LOOPS (ทำงานเบื้องหลัง)
-- ========================================================

-- 1. ลูปสแปม Auto Clicker (ยิง Remote Event)
task.spawn(function()
    while true do
        if Config.AutoClicker.Enabled then
            pcall(function()
                local Event = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Click")
                Event:FireServer()
            end)
        end
        task.wait(Config.AutoClicker.Delay)
    end
end)

-- 2. ระบบ Auto Crit
local function handleCritButton(button)
    if not Config.AutoCrit.Enabled then return end
    if button.Name == "CritButton" then
        if Config.AutoCrit.Delay > 0 then
            task.wait(Config.AutoCrit.Delay)
        end
        if not Config.AutoCrit.Enabled or not button:IsDescendantOf(game) then return end
        
        if firesignal then
            firesignal(button.Activated)
        else
            pcall(function()
                local Shared = ReplicatedStorage:WaitForChild("Shared")
                local Net = require(Shared:WaitForChild("Net"))
                Net.event("CritClick"):FireServer()
            end)
        end
    end
end

local function setupCritUIListener(critUI)
    critUI.ChildAdded:Connect(handleCritButton)
    for _, child in ipairs(critUI:GetChildren()) do
        task.spawn(handleCritButton, child)
    end
end

local function monitorGuis(guiParent)
    guiParent.ChildAdded:Connect(function(child)
        if child.Name == "CritUI" then
            setupCritUIListener(child)
        end
    end)
    local existing = guiParent:FindFirstChild("CritUI")
    if existing then
        setupCritUIListener(existing)
    end
end

task.spawn(monitorGuis, Players.LocalPlayer:WaitForChild("PlayerGui"))
pcall(function()
    task.spawn(monitorGuis, game:GetService("CoreGui"))
end)

-- 3. ลูป Auto Rebirth
task.spawn(function()
    while true do
        if Config.AutoRebirth.Enabled then
            pcall(function()
                local Event = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Rebirth")
                Event:InvokeServer()
            end)
        end
        task.wait(Config.AutoRebirth.Delay)
    end
end)

-- 4. ระบบตรวจจับการเปิดและปิดกล่องทันทีตามสถานะ UI (TapToOpen และ RewardFrame)
task.spawn(function()
    local lastTapClick = 0
    local lastRewardClick = 0
    
    while true do
        if Config.AutoOpenPopups then
            pcall(function()
                local playerGui = LocalPlayer:FindFirstChild("PlayerGui")
                local casesUi = playerGui and playerGui:FindFirstChild("CasesUi")
                local frame = casesUi and casesUi:FindFirstChild("Frame")
                
                if frame then
                    local tapToOpen = frame:FindFirstChild("TapToOpen")
                    local rewardFrame = frame:FindFirstChild("RewardFrame")
                    
                    local camera = workspace.CurrentCamera
                    if camera then
                        local viewportSize = camera.ViewportSize
                        local centerX = viewportSize.X / 2
                        local centerY = viewportSize.Y / 2
                        
                        local GuiService = game:GetService("GuiService")
                        local inset = GuiService:GetGuiInset()
                        local clickX = centerX + inset.X
                        local clickY = centerY + inset.Y
                        
                        local now = os.clock()
                        
                        -- ตรวจจับปุ่มเปิดกล่อง (TapToOpen) -> กดทันทีแบบไม่มีดีเลย์
                        if tapToOpen and tapToOpen.Visible == true and (now - lastTapClick) > 0.5 then
                            lastTapClick = now
                            VIM:SendMouseButtonEvent(clickX, clickY, 0, true, game, 1)
                            task.wait(0.01)
                            VIM:SendMouseButtonEvent(clickX, clickY, 0, false, game, 1)
                        end
                        
                        -- ตรวจจับป้ายประกาศของขวัญขึ้น (RewardFrame) -> กดปิดทันทีแบบไม่มีดีเลย์
                        if rewardFrame and rewardFrame.Visible == true and (now - lastRewardClick) > 0.5 then
                            lastRewardClick = now
                            VIM:SendMouseButtonEvent(clickX, clickY, 0, true, game, 1)
                            task.wait(0.01)
                            VIM:SendMouseButtonEvent(clickX, clickY, 0, false, game, 1)
                        end
                    end
                end
            end)
        end
        task.wait(0.05) -- ความถี่ในการสแกน 20 ครั้งต่อวินาทีเพื่อให้เปิดและปิดป๊อปอัปทันที
    end
end)

-- 5. ลูป Auto Case Opener
task.spawn(function()
    while true do
        if Config.AutoOpenCase.Enabled and Config.AutoOpenCase.SelectedId then
            pcall(function()
                Net.fn("BuyCase"):InvokeServer(Config.AutoOpenCase.SelectedId)
            end)
        end
        task.wait(0.5)
    end
end)

OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})