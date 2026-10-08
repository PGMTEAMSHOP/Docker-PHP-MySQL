local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

-- [[ LIBRARY LOADER ]] --
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

-- [[ SERVICES & PLAYERS ]] --
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local UserInputService = game:GetService("UserInputService")
local TeleportService = game:GetService("TeleportService")
local TweenService = game:GetService("TweenService")
local LocalPlayer = Players.LocalPlayer
local Camera = workspace.CurrentCamera
local Mouse = LocalPlayer:GetMouse()

-- [[ LIGHTING BACKUP ]] --
local OriginalLighting = {
    Brightness = Lighting.Brightness,
    ClockTime = Lighting.ClockTime,
    GlobalShadows = Lighting.GlobalShadows,
    OutdoorAmbient = Lighting.OutdoorAmbient,
    Ambient = Lighting.Ambient
}

-- [[ CONFIG VARIABLES ]] --
local espEnabled = false
local espMode = "Highlight"
local boxColor = Color3.new(1,1,1)
local boxColorIndex = 1
local boxColors = {
    Color3.new(1,1,1), Color3.new(1,0,0), Color3.new(0,1,0),
    Color3.new(0,0,1), Color3.new(1,1,0), Color3.new(1,0,1),
    Color3.new(0,1,1)
}
local boxColorNames = {"White","Red","Green","Blue","Yellow","Pink","Cyan"}

local aimEnabled = false
local aimMode = "Hold Right Click" -- "Hold Right Click" or "Always (Mobile / Touch)"
local aimKey = Enum.UserInputType.MouseButton2
local aimPart = "Head"
local fovSize = 150
local fovColor = Color3.new(1,0,0)
local fovColorIndex = 1
local fovColors = {
    Color3.new(1,0,0), Color3.new(0,1,0), Color3.new(0,0,1),
    Color3.new(1,1,0), Color3.new(1,0,1), Color3.new(0,1,1),
    Color3.new(1,1,1)
}
local fovColorNames = {"Red","Green","Blue","Yellow","Pink","Cyan","White"}
local smoothness = 0.3

-- [[ WEAPON MODS CONFIG ]] --
local noRecoilEnabled = false
local fastFireEnabled = false
local noSpreadEnabled = false
local instantReloadEnabled = false
local infMagazinesEnabled = false

local originalWeaponData = {} -- เก็บค่าดั้งเดิมของปืน

-- [[ FOV CIRCLE FUNCTION ]] --
local fovCircle = nil
local function updateFOVCircle()
    if Drawing and Drawing.new then
        if not fovCircle then
            fovCircle = Drawing.new("Circle")
            fovCircle.NumSides = 64
        end
        fovCircle.Radius = fovSize
        fovCircle.Thickness = 2
        fovCircle.Color = fovColor
        fovCircle.Visible = aimEnabled
    else
        if fovCircle then fovCircle.Visible = false end
    end
end

-- [[ ESP FUNCTIONS ]] --
local boxLines = {}
local function removeAllHighlights()
    for _, plr in pairs(Players:GetPlayers()) do
        if plr.Character then
            local hl = plr.Character:FindFirstChildOfClass("Highlight")
            if hl then hl:Destroy() end
        end
    end
end

local function removeAllBoxes()
    for plr, lines in pairs(boxLines) do
        for _, line in pairs(lines) do line:Remove() end
    end
    boxLines = {}
end

local function updateHighlights()
    if not espEnabled or espMode ~= "Highlight" then
        removeAllHighlights()
        return
    end
    for _, plr in pairs(Players:GetPlayers()) do
        local isEnemy = plr ~= LocalPlayer and (not LocalPlayer.Team or plr.Team ~= LocalPlayer.Team)
        if isEnemy and plr.Character then
            local hl = plr.Character:FindFirstChildOfClass("Highlight")
            if not hl then
                hl = Instance.new("Highlight")
                hl.Parent = plr.Character
                hl.FillTransparency = 0.6
                hl.OutlineTransparency = 0.2
            end
            hl.FillColor = boxColor
            hl.OutlineColor = boxColor
        else
            if plr.Character then
                local hl = plr.Character:FindFirstChildOfClass("Highlight")
                if hl then hl:Destroy() end
            end
        end
    end
end

local function createBoxLinesForPlayer(plr)
    if boxLines[plr] then return end
    local lines = {}
    -- 1 to 8: Corner box lines (thickness = 2)
    for i=1,8 do
        lines[i] = Drawing.new("Line")
        lines[i].Thickness = 2
        lines[i].Color = boxColor
        lines[i].Visible = false
    end
    -- 9: Health bar background (thickness = 4, black)
    lines[9] = Drawing.new("Line")
    lines[9].Thickness = 4
    lines[9].Color = Color3.new(0, 0, 0)
    lines[9].Visible = false
    
    -- 10: Health bar value (thickness = 2, green)
    lines[10] = Drawing.new("Line")
    lines[10].Thickness = 2
    lines[10].Color = Color3.new(0, 1, 0)
    lines[10].Visible = false
    
    boxLines[plr] = lines
end

local function updateBoxes()
    if not espEnabled or espMode ~= "Box" then
        for _, lines in pairs(boxLines) do
            for _, line in pairs(lines) do line.Visible = false end
        end
        return
    end
    for _, plr in pairs(Players:GetPlayers()) do
        local isEnemy = plr ~= LocalPlayer and (not LocalPlayer.Team or plr.Team ~= LocalPlayer.Team)
        if isEnemy and plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") and plr.Character:FindFirstChildOfClass("Humanoid") then
            createBoxLinesForPlayer(plr)
            local root = plr.Character.HumanoidRootPart
            local humanoid = plr.Character:FindFirstChildOfClass("Humanoid")
            local rPos, rVis = Camera:WorldToViewportPoint(root.Position)
            if rVis then
                local rootCF = root.CFrame
                local topPos, topVis = Camera:WorldToViewportPoint(rootCF.Position + Vector3.new(0, 3, 0))
                local botPos, botVis = Camera:WorldToViewportPoint(rootCF.Position + Vector3.new(0, -3.5, 0))
                
                if topVis and botVis then
                    local height = math.abs(botPos.Y - topPos.Y)
                    local width = height * 0.6
                    
                    local left = rPos.X - width/2
                    local right = rPos.X + width/2
                    local top = topPos.Y
                    local bottom = botPos.Y
                    
                    local cornerSize = width / 4
                    local lines = boxLines[plr]
                    
                    -- Top-Left Corner
                    lines[1].From = Vector2.new(left, top)
                    lines[1].To = Vector2.new(left + cornerSize, top)
                    
                    lines[2].From = Vector2.new(left, top)
                    lines[2].To = Vector2.new(left, top + cornerSize)
                    
                    -- Top-Right Corner
                    lines[3].From = Vector2.new(right, top)
                    lines[3].To = Vector2.new(right - cornerSize, top)
                    
                    lines[4].From = Vector2.new(right, top)
                    lines[4].To = Vector2.new(right, top + cornerSize)
                    
                    -- Bottom-Left Corner
                    lines[5].From = Vector2.new(left, bottom)
                    lines[5].To = Vector2.new(left + cornerSize, bottom)
                    
                    lines[6].From = Vector2.new(left, bottom)
                    lines[6].To = Vector2.new(left, bottom - cornerSize)
                    
                    -- Bottom-Right Corner
                    lines[7].From = Vector2.new(right, bottom)
                    lines[7].To = Vector2.new(right - cornerSize, bottom)
                    
                    lines[8].From = Vector2.new(right, bottom)
                    lines[8].To = Vector2.new(right, bottom - cornerSize)
                    
                    -- Health Bar Position
                    local barLeft = left - 6
                    local health = math.clamp(humanoid.Health / humanoid.MaxHealth, 0, 1)
                    
                    -- Health Bar BG
                    lines[9].From = Vector2.new(barLeft, bottom)
                    lines[9].To = Vector2.new(barLeft, top)
                    
                    -- Health Bar Value
                    lines[10].From = Vector2.new(barLeft, bottom)
                    lines[10].To = Vector2.new(barLeft, bottom - (height * health))
                    
                    -- Set Colors and Visibility
                    for i = 1, 8 do
                        lines[i].Color = boxColor
                        lines[i].Visible = true
                    end
                    
                    lines[9].Color = Color3.new(0, 0, 0)
                    lines[9].Visible = true
                    
                    lines[10].Color = Color3.new(0, 1, 0)
                    lines[10].Visible = true
                else
                    if boxLines[plr] then for _, line in pairs(boxLines[plr]) do line.Visible = false end end
                end
            else
                if boxLines[plr] then for _, line in pairs(boxLines[plr]) do line.Visible = false end end
            end
        else
            if boxLines[plr] then for _, line in pairs(boxLines[plr]) do line.Visible = false end end
        end
    end
end

local function refreshESP()
    if not espEnabled then
        removeAllHighlights()
        removeAllBoxes()
        return
    end
    if espMode == "Highlight" then
        removeAllBoxes()
    else
        removeAllHighlights()
    end
end

-- [[ PLAYER CONNECTIONS FOR ESP ]] --
Players.PlayerRemoving:Connect(function(plr)
    if boxLines[plr] then
        for _, line in pairs(boxLines[plr]) do line:Remove() end
        boxLines[plr] = nil
    end
end)

-- [[ AIMBOT FUNCTIONS ]] --
local function getTargetPart(plr)
    if aimPart == "Head" then
        return plr.Character:FindFirstChild("Head")
    else
        return plr.Character:FindFirstChild("HumanoidRootPart")
    end
end

local function getClosestEnemy()
    local center = Vector2.new(Camera.ViewportSize.X/2, Camera.ViewportSize.Y/2)
    local closest = nil
    local closestDist = fovSize
    for _, plr in pairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and plr.Character then
            local humanoid = plr.Character:FindFirstChildOfClass("Humanoid")
            if humanoid and humanoid.Health > 0 and (not LocalPlayer.Team or plr.Team ~= LocalPlayer.Team) then
                local targetPart = getTargetPart(plr)
                if targetPart then
                    local screenPos, onScreen = Camera:WorldToViewportPoint(targetPart.Position)
                    if onScreen then
                        local dist = (center - Vector2.new(screenPos.X, screenPos.Y)).Magnitude
                        if dist < closestDist then
                            closestDist = dist
                            closest = targetPart
                        end
                    end
                end
            end
        end
    end
    return closest
end

local function cameraAim(target)
    if not target then return end
    local currentCF = Camera.CFrame
    local targetCF = CFrame.new(currentCF.Position, target.Position)
    
    -- Invert smoothness so:
    -- UI Slider (0.1 = super fast/hard lock, 1.0 = very smooth/slow)
    -- If smoothness is low, we want a high lerp alpha (harder lock)
    local alpha = math.clamp(1.1 - smoothness, 0.05, 1.0)
    
    -- If in Always / Mobile mode, apply a gentle pull (Aim Assist)
    if aimMode == "Always (Mobile / Touch)" then
        alpha = alpha * 0.15 -- Apply only 15% of the lock force to allow manual dragging
    end
    
    Camera.CFrame = currentCF:Lerp(targetCF, alpha)
end

-- [[ RUNSERVICE LOOPS ]] --
RunService.RenderStepped:Connect(function()
    if fovCircle and fovCircle.Visible then
        local mousePos = UserInputService:GetMouseLocation()
        fovCircle.Position = Vector2.new(mousePos.X, mousePos.Y)
    end
    updateBoxes()
    updateHighlights()
end)

RunService:BindToRenderStep("OSX_Aimbot", Enum.RenderPriority.Camera.Value + 1, function()
    if not aimEnabled then return end
    local shouldAim = false
    if aimMode == "Always (Mobile / Touch)" then
        -- Automatically lock onto target in FOV without requiring touch/click inputs
        shouldAim = true
    else
        -- PC / Hold Right Click mode
        if aimKey.EnumType == Enum.UserInputType then
            shouldAim = UserInputService:IsMouseButtonPressed(aimKey)
        else
            shouldAim = UserInputService:IsKeyDown(aimKey)
        end
    end
    if shouldAim then
        local target = getClosestEnemy()
        if target then
            cameraAim(target)
        end
    end
end)

-- [[ WEAPON MODIFICATION ENGINE ]] --
task.spawn(function()
    while true do
        local success, err = pcall(function()
            local Shared = game:GetService("ReplicatedStorage"):FindFirstChild("Shared")
            local WeaponConfigManager = Shared and Shared:FindFirstChild("WeaponConfigManager")
            
            if WeaponConfigManager then
                for _, module in ipairs(WeaponConfigManager:GetDescendants()) do
                    if module:IsA("ModuleScript") then
                        local weaponData = require(module)
                        if type(weaponData) == "table" then
                            for _, data in ipairs(weaponData) do
                                if type(data) == "table" then
                                    -- ตั้งค่า Backup สำหรับข้อมูลปืน
                                    if not originalWeaponData[data] then
                                        originalWeaponData[data] = {
                                            Firerate = data.Firerate or 700,
                                            Spread = data.Spread or 0.15,
                                            ReloadTime = data.ReloadTime or 10,
                                            Magazines = data.Magazines or 4,
                                            Recoil = data.Recoil and {
                                                CameraRecoilVertical = data.Recoil.CameraRecoilVertical or 0,
                                                CameraRecoilHorizontal = data.Recoil.CameraRecoilHorizontal or 0,
                                                GunRecoilVertical = data.Recoil.GunRecoilVertical or 0,
                                                GunRecoilHorizontal = data.Recoil.GunRecoilHorizontal or 0,
                                                RecoilKick = data.Recoil.RecoilKick or 0
                                            } or {}
                                        }
                                    end
                                    
                                    local backup = originalWeaponData[data]
                                    
                                    -- [[ MOD: NO RECOIL ]] --
                                    if data.Recoil then
                                        if noRecoilEnabled then
                                            data.Recoil.CameraRecoilVertical = 0
                                            data.Recoil.CameraRecoilHorizontal = 0
                                            data.Recoil.GunRecoilVertical = 0
                                            data.Recoil.GunRecoilHorizontal = 0
                                            data.Recoil.RecoilKick = 0
                                        else
                                            data.Recoil.CameraRecoilVertical = backup.Recoil.CameraRecoilVertical
                                            data.Recoil.CameraRecoilHorizontal = backup.Recoil.CameraRecoilHorizontal
                                            data.Recoil.GunRecoilVertical = backup.Recoil.GunRecoilVertical
                                            data.Recoil.GunRecoilHorizontal = backup.Recoil.GunRecoilHorizontal
                                            data.Recoil.RecoilKick = backup.Recoil.RecoilKick
                                        end
                                    end
                                    
                                    -- [[ MOD: FAST FIRERATE ]] --
                                    if data.Firerate then
                                        if fastFireEnabled then
                                            data.Firerate = 1500 -- เพิ่ม Firerate ขึ้นเป็น 1500
                                        else
                                            data.Firerate = backup.Firerate
                                        end
                                    end
                                    
                                    -- [[ MOD: NO SPREAD ]] --
                                    if data.Spread then
                                        if noSpreadEnabled then
                                            data.Spread = 0 -- เอาความส่ายออกทั้งหมด
                                        else
                                            data.Spread = backup.Spread
                                        end
                                    end

                                    -- [[ MOD: INSTANT RELOAD ]] --
                                    if data.ReloadTime then
                                        if instantReloadEnabled then
                                            data.ReloadTime = 0
                                        else
                                            data.ReloadTime = backup.ReloadTime
                                        end
                                    end

                                    -- [[ MOD: INFINITE MAGAZINES ]] --
                                    if data.Magazines then
                                        if infMagazinesEnabled then
                                            data.Magazines = 10
                                        else
                                            data.Magazines = backup.Magazines
                                        end
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end)
        task.wait(1)
    end
end)

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | COLD WAR",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ 1. INFO TAB ]] --
local Tab1 = Window:AddTab({ Title = "Info", Icon = "info", SubDescription = "Script Information" })
local DevPanel = Tab1:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer Main", "LilYouDev1997x")
DevPanel:AddInfoLabel("Developer Support", "0b1100001cat")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- [[ 2. ESP TAB ]] --
local Tab2 = Window:AddTab({ Title = "ESP", Icon = "eye", SubDescription = "Player Visuals" })
local ESPPanel = Tab2:AddPanel("ESP Control")

ESPPanel:AddToggle({
    Title = "Enable ESP",
    Description = "เปิด/ปิด การมองเห็นทะลุกำแพง (ESP)",
    Default = espEnabled,
    Callback = function(state)
        espEnabled = state
        refreshESP()
    end
})

ESPPanel:AddDropdown({
    Title = "ESP Mode",
    Description = "เลือกสไตล์การมองเห็นผู้เล่น",
    Values = {"Highlight", "Box"},
    Default = "Highlight",
    Callback = function(mode)
        espMode = mode
        refreshESP()
    end
})

ESPPanel:AddDropdown({
    Title = "Box Color",
    Description = "เลือกสีเส้นขอบสำหรับ Box ESP",
    Values = boxColorNames,
    Default = "Green",
    Callback = function(colorName)
        for i, name in ipairs(boxColorNames) do
            if name == colorName then
                boxColorIndex = i
                boxColor = boxColors[i]
                break
            end
        end
        for plr, lines in pairs(boxLines) do
            for i = 1, 8 do lines[i].Color = boxColor end
        end
        refreshESP()
    end
})

-- [[ 3. AIM TAB ]] --
local Tab3 = Window:AddTab({ Title = "Aim", Icon = "target", SubDescription = "Combat Assist" })
local AimPanel = Tab3:AddPanel("Aimbot Settings")

AimPanel:AddToggle({
    Title = "Enable Aimbot",
    Description = "ล็อกมุมกล้องหรือเมาส์ไปที่ศัตรูที่ใกล้ที่สุด",
    Default = aimEnabled,
    Callback = function(state)
        aimEnabled = state
        updateFOVCircle()
    end
})

AimPanel:AddDropdown({
    Title = "Aim Mode",
    Description = "วิธีการเปิดใช้งานระบบช่วยเล็ง",
    Values = {"Hold Right Click", "Always (Mobile / Touch)"},
    Default = "Hold Right Click",
    Callback = function(mode)
        aimMode = mode
    end
})

AimPanel:AddDropdown({
    Title = "Aim Part",
    Description = "เป้าหมายที่จะล็อกตัวศัตรู",
    Values = {"Head", "HumanoidRootPart"},
    Default = "Head",
    Callback = function(part)
        aimPart = part
    end
})

AimPanel:AddSlider({
    Title = "Smoothness",
    Description = "ความลื่นไหลของการช่วยเล็ง (ยิ่งน้อยยิ่งล็อกเร็ว)",
    Min = 0.1,
    Max = 1.0,
    Default = smoothness,
    Rounding = 1,
    Callback = function(val)
        smoothness = val
    end
})

AimPanel:AddSlider({
    Title = "FOV Size",
    Description = "ขนาดของวงกลมช่วยเล็ง",
    Min = 1,
    Max = 300,
    Default = fovSize,
    Rounding = 0,
    Callback = function(val)
        fovSize = val
        updateFOVCircle()
    end
})

AimPanel:AddDropdown({
    Title = "FOV Color",
    Description = "สีของวงกลมช่วยเล็ง (FOV)",
    Values = fovColorNames,
    Default = "Red",
    Callback = function(colorName)
        for i, name in ipairs(fovColorNames) do
            if name == colorName then
                fovColorIndex = i
                fovColor = fovColors[i]
                break
            end
        end
        updateFOVCircle()
    end
})

local WeaponPanel = Tab3:AddPanel("Weapon Modifications")

WeaponPanel:AddToggle({
    Title = "No Recoil",
    Description = "เอาแรงดีดของปืนออกทั้งหมด",
    Default = noRecoilEnabled,
    Callback = function(state)
        noRecoilEnabled = state
    end
})

WeaponPanel:AddToggle({
    Title = "Fast Firerate",
    Description = "เพิ่มอัตราการยิงปืนเป็น 1500 RPM",
    Default = fastFireEnabled,
    Callback = function(state)
        fastFireEnabled = state
    end
})
-- [[ 5. SETTINGS TAB ]] --
local Tab5 = Window:AddTab({ Title = "Settings", Icon = "settings", SubDescription = "System Options" })
local SettingsPanel = Tab5:AddPanel("Game Utility")

SettingsPanel:AddButton({
    Title = "Rejoin Server",
    Description = "เชื่อมต่อกลับเข้าเซิร์ฟเวอร์เดิมอีกครั้ง",
    Callback = function()
        TeleportService:Teleport(game.PlaceId, LocalPlayer)
    end
})

SettingsPanel:AddButton({
    Title = "Server Hop",
    Description = "ค้นหาและย้ายไปยังเซิร์ฟเวอร์ใหม่อื่นที่มีผู้เล่นอยู่",
    Callback = function()
        local servers = {}
        local success, result = pcall(function()
            return game:GetService("HttpService"):JSONDecode(game:HttpGetAsync("https://games.roblox.com/v1/games/" .. game.PlaceId .. "/servers/Public?sortOrder=Asc&limit=100"))
        end)
        if success and result.data then
            for _, server in pairs(result.data) do
                if server.playing < server.maxPlayers and server.id ~= game.JobId then
                    table.insert(servers, server.id)
                end
            end
            if #servers > 0 then
                TeleportService:TeleportToPlaceInstance(game.PlaceId, servers[math.random(1, #servers)])
            end
        end
    end
})

-- [[ INITIALIZE DRAWING ]] --
updateFOVCircle()
refreshESP()

-- [[ NOTIFY ]] --
OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})